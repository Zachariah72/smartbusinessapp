import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package as PackageIcon,
  Plus,
  Pin,
  Truck,
  Store,
  Sparkles,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { formatKES } from "@/lib/demo-data";
import { useBusinessData } from "@/context/BusinessDataContext";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
  cost: number;
  stock: number;
  pricePerUnit: number;
  lastRestockDays: number;
}

interface ProductComputed extends ProductItem {
  trend: number;
}

interface WatchInsight {
  label: string;
  className: string;
  message: string;
}

type QualityPreference = "low" | "medium" | "high";

type SupplierTrust = "trusted" | "neutral" | "avoid";

interface Supplier {
  id: string;
  name: string;
  market: string;
  type: "wholesaler" | "distributor";
  pricePerUnit: number;
  qualityScore: number;
  reliabilityScore: number;
  distanceKm: number;
  deliveryHours: number;
  cashFriendly: boolean;
  informalFriendly: boolean;
  usedBySimilarBusinesses: number;
}

interface SupplierMemory {
  supplierId: string;
  timesUsed: number;
  trust: SupplierTrust;
  negotiatedPrice?: number;
}

interface RestockRequest {
  productName: string;
  category: string;
  quantity: number;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocation?: string;
  qualityPreference: QualityPreference;
}

interface RankedSupplier {
  supplier: Supplier;
  score: number;
  tier: 1 | 2 | 3;
  reason: string;
}

const SUPPLIER_MEMORY_KEY = "ssi_supplier_memory";

const initialProducts: ProductItem[] = [
  { id: "1", name: "Premium Coffee Beans", category: "Beverages", sold: 456, revenue: 684000, cost: 342000, stock: 120, pricePerUnit: 1500, lastRestockDays: 8 },
  { id: "2", name: "Organic Tea Collection", category: "Beverages", sold: 382, revenue: 573000, cost: 287000, stock: 85, pricePerUnit: 1500, lastRestockDays: 11 },
  { id: "3", name: "Fresh Juice Pack", category: "Beverages", sold: 298, revenue: 447000, cost: 268000, stock: 45, pricePerUnit: 1500, lastRestockDays: 14 },
  { id: "4", name: "Snack Bundle", category: "Food", sold: 267, revenue: 400500, cost: 200000, stock: 200, pricePerUnit: 1500, lastRestockDays: 6 },
  { id: "5", name: "Water Bottles (12pk)", category: "Beverages", sold: 234, revenue: 280800, cost: 140000, stock: 350, pricePerUnit: 1200, lastRestockDays: 5 },
  { id: "6", name: "Maize Flour 2kg", category: "Food", sold: 189, revenue: 189000, cost: 132000, stock: 15, pricePerUnit: 1000, lastRestockDays: 19 },
  { id: "7", name: "Cooking Oil 1L", category: "Food", sold: 156, revenue: 234000, cost: 156000, stock: 8, pricePerUnit: 1500, lastRestockDays: 17 },
  { id: "8", name: "Sugar 1kg", category: "Food", sold: 134, revenue: 107200, cost: 80400, stock: 5, pricePerUnit: 800, lastRestockDays: 21 },
];

const suppliers: Supplier[] = [
  { id: "s1", name: "Gikomba Wholesaler", market: "Gikomba", type: "wholesaler", pricePerUnit: 860, qualityScore: 4.2, reliabilityScore: 4.6, distanceKm: 4, deliveryHours: 6, cashFriendly: true, informalFriendly: true, usedBySimilarBusinesses: 12 },
  { id: "s2", name: "Dubois Bulk Traders", market: "Dubois", type: "wholesaler", pricePerUnit: 830, qualityScore: 3.8, reliabilityScore: 4.1, distanceKm: 5, deliveryHours: 8, cashFriendly: true, informalFriendly: true, usedBySimilarBusinesses: 9 },
  { id: "s3", name: "Kariobangi Distributor Hub", market: "Kariobangi", type: "distributor", pricePerUnit: 910, qualityScore: 4.5, reliabilityScore: 4.7, distanceKm: 8, deliveryHours: 10, cashFriendly: false, informalFriendly: false, usedBySimilarBusinesses: 16 },
  { id: "s4", name: "Eastleigh Rapid Supply", market: "Eastleigh", type: "wholesaler", pricePerUnit: 980, qualityScore: 4.0, reliabilityScore: 3.9, distanceKm: 7, deliveryHours: 4, cashFriendly: true, informalFriendly: true, usedBySimilarBusinesses: 6 },
  { id: "s5", name: "Industrial Area Distributors", market: "Industrial Area", type: "distributor", pricePerUnit: 1020, qualityScore: 4.7, reliabilityScore: 4.8, distanceKm: 9, deliveryHours: 12, cashFriendly: false, informalFriendly: false, usedBySimilarBusinesses: 14 },
  { id: "s6", name: "Kawangware Cash Suppliers", market: "Kawangware", type: "wholesaler", pricePerUnit: 900, qualityScore: 3.6, reliabilityScore: 3.5, distanceKm: 11, deliveryHours: 5, cashFriendly: true, informalFriendly: true, usedBySimilarBusinesses: 4 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeAutoTrend(product: ProductItem): number {
  const marginRate = (product.revenue - product.cost) / Math.max(1, product.revenue);
  const stockHealth = product.stock < 10 ? -9 : product.stock < 25 ? -4 : product.stock < 60 ? 1 : 4;
  const velocity = product.sold >= 320 ? 8 : product.sold >= 220 ? 5 : product.sold >= 140 ? 1 : -3;
  const marginSignal = marginRate > 0.4 ? 5 : marginRate > 0.25 ? 2 : -4;
  const unitConsistency = (product.revenue / Math.max(1, product.sold)) >= product.pricePerUnit * 0.95 ? 2 : -2;
  return clamp(Math.round(stockHealth + velocity + marginSignal + unitConsistency), -20, 20);
}

function loadSupplierMemory(): SupplierMemory[] {
  try {
    const raw = localStorage.getItem(SUPPLIER_MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupplierMemory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreSuppliers(request: RestockRequest, memory: SupplierMemory[]): RankedSupplier[] {
  const prices = suppliers.map((s) => s.pricePerUnit);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const targetQuality = request.qualityPreference === "high" ? 4.5 : request.qualityPreference === "medium" ? 3.8 : 3.2;

  const ranked = suppliers.map((supplier) => {
    const history = memory.find((item) => item.supplierId === supplier.id);
    const estimatedCost = supplier.pricePerUnit * Math.max(1, request.quantity);

    const normalizedPrice = 1 - (supplier.pricePerUnit - minPrice) / Math.max(1, maxPrice - minPrice);
    let score = normalizedPrice * 30;

    const qualityDiff = Math.abs(supplier.qualityScore - targetQuality);
    score += Math.max(0, 20 - qualityDiff * 8);
    score += supplier.reliabilityScore * 4;
    score += Math.max(0, 10 - supplier.distanceKm);

    if (request.preferredLocation && supplier.market.toLowerCase().includes(request.preferredLocation.toLowerCase())) {
      score += 8;
    }

    if (request.budgetMax) {
      score += estimatedCost <= request.budgetMax ? 10 : -15;
    }

    if (supplier.cashFriendly) score += 4;
    if (supplier.informalFriendly) score += 3;

    score += Math.min(8, supplier.usedBySimilarBusinesses / 2);

    if (history) {
      score += Math.min(5, history.timesUsed);
      if (history.trust === "trusted") score += 10;
      if (history.trust === "avoid") score -= 12;
      if (history.negotiatedPrice && history.negotiatedPrice < supplier.pricePerUnit) score += 4;
    }

    const reason = supplier.reliabilityScore >= 4.5
      ? "Balances price, quality, and cash flow safety."
      : supplier.deliveryHours <= 6
        ? "Best when you need fast restocking with low disruption."
        : "Useful backup choice when other suppliers are unavailable.";

    return { supplier, score, reason };
  }).sort((a, b) => b.score - a.score);

  return ranked.map((item, idx) => ({
    ...item,
    tier: idx === 0 ? 1 : idx < 3 ? 2 : 3,
  }));
}

const ProductsPage = () => {
  const { routedProducts, routedSuppliers } = useBusinessData();
  const MAX_PINNED_PRODUCTS = 10;

  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSold, setNewSold] = useState("");
  const [newRevenue, setNewRevenue] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPricePerUnit, setNewPricePerUnit] = useState("");
  const [newLastRestockDays, setNewLastRestockDays] = useState("");

  const [restockQty, setRestockQty] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [qualityPreference, setQualityPreference] = useState<QualityPreference>("medium");
  const [showSupplierPanel, setShowSupplierPanel] = useState(false);

  const [productToDelete, setProductToDelete] = useState<ProductComputed | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<string[]>([]);
  const [selectedWatchProduct, setSelectedWatchProduct] = useState<ProductComputed | null>(null);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);

  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");

  const [supplierMemory, setSupplierMemory] = useState<SupplierMemory[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  useEffect(() => {
    setSupplierMemory(loadSupplierMemory());
  }, []);

  useEffect(() => {
    localStorage.setItem(SUPPLIER_MEMORY_KEY, JSON.stringify(supplierMemory));
  }, [supplierMemory]);

  const computedProducts = useMemo<ProductComputed[]>(
    () => products.map((item) => ({ ...item, trend: computeAutoTrend(item) })),
    [products],
  );

  const chartData = computedProducts.slice(0, 6).map((p) => ({
    name: p.name.length > 12 ? `${p.name.substring(0, 12)}…` : p.name,
    profit: p.revenue - p.cost,
  }));

  const lowStock = computedProducts.filter((p) => p.stock < 20);
  const slowMoving = computedProducts.filter((p) => p.trend < 0);

  const currentRestockRequest = useMemo<RestockRequest>(() => ({
    productName: newName || "New Product",
    category: newCategory || "General",
    quantity: Number(restockQty) || 0,
    budgetMin: budgetMin ? Number(budgetMin) : undefined,
    budgetMax: budgetMax ? Number(budgetMax) : undefined,
    preferredLocation: preferredLocation || undefined,
    qualityPreference,
  }), [budgetMax, budgetMin, newCategory, newName, preferredLocation, qualityPreference, restockQty]);

  const rankedSuppliers = useMemo(() => {
    if (currentRestockRequest.quantity <= 0 || !newCategory.trim()) return [];
    return scoreSuppliers(currentRestockRequest, supplierMemory);
  }, [currentRestockRequest, newCategory, supplierMemory]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) ?? null,
    [selectedSupplierId],
  );

  const passiveSupplierInsights = useMemo(() => {
    const focusProducts = [...computedProducts]
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);

    return focusProducts.map((product) => {
      const quantity = clamp(24 + (30 - Math.min(product.stock, 30)), 12, 120);
      const request: RestockRequest = {
        productName: product.name,
        category: product.category,
        quantity,
        qualityPreference: "medium",
      };
      const best = scoreSuppliers(request, supplierMemory)[0];
      const categorySuppliers = suppliers;
      const marketAvg = categorySuppliers.reduce((acc, item) => acc + item.pricePerUnit, 0) / categorySuppliers.length;

      const trendLabel = product.pricePerUnit > marketAvg * 1.08 ? "Rising" : product.pricePerUnit < marketAvg * 0.92 ? "Falling" : "Stable";
      const trendClass = trendLabel === "Rising" ? "text-destructive" : trendLabel === "Falling" ? "text-amber-700" : "text-primary";

      return {
        product,
        best,
        quantity,
        trendLabel,
        trendClass,
      };
    });
  }, [computedProducts, supplierMemory]);

  const addProduct = () => {
    if (!newName.trim() || !newCategory.trim()) return;

    const sold = Number(newSold) || 0;
    const quantityNeeded = Number(restockQty) || 0;
    const supplierUnitPrice = selectedSupplier?.pricePerUnit;
    const pricePerUnit = Number(newPricePerUnit) || supplierUnitPrice || 0;
    const fallbackRevenue = sold > 0 && pricePerUnit > 0 ? sold * pricePerUnit : 0;
    const revenue = Number(newRevenue) || fallbackRevenue;
    const cost = Number(newCost) || Math.round(revenue * 0.6);

    const item: ProductItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      category: newCategory.trim(),
      sold,
      revenue,
      cost,
      stock: Number(newStock) || quantityNeeded,
      pricePerUnit: pricePerUnit || Math.round(revenue / Math.max(1, sold)),
      lastRestockDays: Number(newLastRestockDays) || 0,
    };

    if (selectedSupplier) {
      setSupplierMemory((prev) => {
        const existing = prev.find((m) => m.supplierId === selectedSupplier.id);
        if (!existing) {
          return [...prev, { supplierId: selectedSupplier.id, timesUsed: 1, trust: "trusted", negotiatedPrice: selectedSupplier.pricePerUnit }];
        }
        return prev.map((m) => m.supplierId === selectedSupplier.id ? {
          ...m,
          timesUsed: m.timesUsed + 1,
          trust: m.trust === "avoid" ? "neutral" : "trusted",
          negotiatedPrice: selectedSupplier.pricePerUnit,
        } : m);
      });
    }

    setProducts((prev) => [item, ...prev]);

    setNewName("");
    setNewCategory("");
    setNewSold("");
    setNewRevenue("");
    setNewCost("");
    setNewStock("");
    setNewPricePerUnit("");
    setNewLastRestockDays("");
    setRestockQty("");
    setBudgetMin("");
    setBudgetMax("");
    setPreferredLocation("");
    setQualityPreference("medium");
    setShowSupplierPanel(false);
    setSelectedSupplierId(null);
    setShowAdd(false);
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    setWatchlist((prev) => prev.filter((productId) => productId !== id));
    setPinnedProducts((prev) => prev.filter((productId) => productId !== id));
    setProductToDelete(null);
  };

  const startEditPrice = (product: ProductItem) => {
    setEditingPriceProductId(product.id);
    setEditingPriceValue(String(product.pricePerUnit));
  };

  const cancelEditPrice = () => {
    setEditingPriceProductId(null);
    setEditingPriceValue("");
  };

  const saveEditPrice = (productId: string) => {
    const parsed = Number(editingPriceValue);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, pricePerUnit: parsed }
          : item,
      ),
    );
    cancelEditPrice();
  };

  const toggleWatchlist = (id: string) => {
    setWatchlist((prev) => (prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]));
  };

  const watchlistProducts = useMemo(
    () => computedProducts.filter((item) => watchlist.includes(item.id)),
    [computedProducts, watchlist],
  );

  const watchlistSorted = useMemo(() => {
    return [...watchlistProducts].sort((a, b) => {
      const aPinned = pinnedProducts.includes(a.id) ? 1 : 0;
      const bPinned = pinnedProducts.includes(b.id) ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [pinnedProducts, watchlistProducts]);

  const togglePinProduct = (productId: string) => {
    setPinnedProducts((prev) => {
      const alreadyPinned = prev.includes(productId);
      if (alreadyPinned) return prev.filter((id) => id !== productId);
      if (prev.length >= MAX_PINNED_PRODUCTS) {
        setShowPremiumPrompt(true);
        return prev;
      }
      return [...prev, productId];
    });
  };

  const getWatchInsight = (product: ProductComputed): WatchInsight => {
    if (product.trend <= -5 || product.stock < 10) {
      return {
        label: "At Risk",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        message: product.stock < 10
          ? "Stock is critically low and can hurt sales continuity. Reorder soon."
          : "Sales trend is falling. Recheck pricing, visibility, or product placement.",
      };
    }
    if (product.trend < 4 || product.stock < 30) {
      return {
        label: "Needs Attention",
        className: "bg-amber-100 text-amber-800 border-amber-300/50",
        message: "Performance is mixed. Watch weekly movement and protect stock timing.",
      };
    }
    return {
      label: "Doing Well",
      className: "bg-primary/10 text-primary border-primary/30",
      message: "Sales behavior is healthy. Keep strategy consistent and maintain availability.",
    };
  };

  const buildWeeklySeries = (product: ProductComputed) => {
    const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
    const base = Math.max(20, Math.round(product.sold / 6));
    return weeks.map((week, index) => {
      const trendFactor = 1 + (product.trend / 100) * ((index - 2) / 3);
      const seasonalFactor = 1 + (index % 2 === 0 ? 0.04 : -0.03);
      const sold = Math.max(8, Math.round(base * trendFactor * seasonalFactor));
      const revenue = Math.round(product.pricePerUnit * sold);
      return { week, sold, revenue };
    });
  };

  const buildMarginSeries = (product: ProductComputed) => {
    const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
    const unitCost = product.cost / Math.max(1, product.sold);
    return weeks.map((week, index) => {
      const priceDrift = 1 + (product.trend / 250) * (index / 5);
      const costDrift = 1 + (product.stock < 30 ? 0.05 : 0.015) * (index / 5);
      const margin = Math.max(0, Math.round(product.pricePerUnit * priceDrift - unitCost * costDrift));
      return { week, margin };
    });
  };

  const productComments = (product: ProductComputed) => {
    const insight = getWatchInsight(product);
    return [
      `Status: ${insight.label}. ${insight.message}`,
      product.trend >= 8
        ? "Momentum is strong. Keep this product visible and avoid stock interruptions."
        : product.trend <= -5
          ? "Demand is softening. Test bundles or reposition pricing this week."
          : "Movement is moderate. Track weekly demand before making large changes.",
      product.stock < 20
        ? "Inventory pressure is high. Replenish early to avoid losing repeat buyers."
        : "Stock coverage is acceptable. Continue monitoring sell-through pace.",
    ];
  };

  const applySupplierSuggestion = (product: ProductComputed, supplier: Supplier, qty: number) => {
    setShowAdd(true);
    setNewName(product.name);
    setNewCategory(product.category);
    setRestockQty(String(qty));
    setNewPricePerUnit(String(supplier.pricePerUnit));
    setSelectedSupplierId(supplier.id);
    setShowSupplierPanel(true);
  };

  return (
    <DashboardLayout title="Product Analytics" subtitle="Track product performance and inventory">
      <div className="space-y-6">
        {(routedProducts.length > 0 || routedSuppliers.length > 0) && (
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground">Auto-Routed Upload Entities</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Detected Products</p>
                {routedProducts.slice(0, 5).map((item) => (
                  <p key={item.traceKey} className="text-sm text-muted-foreground">
                    {item.name} · Qty {item.quantity || 0} · Unit {formatKES(item.unitCost || 0)}
                  </p>
                ))}
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Detected Suppliers</p>
                {routedSuppliers.slice(0, 5).map((item) => (
                  <p key={item.traceKey} className="text-sm text-muted-foreground">
                    {item.name} · Last Price {formatKES(item.lastPrice || 0)} · {item.riskLevel}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" className="gap-2" onClick={() => setShowAdd((prev) => !prev)}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>

        {showAdd && (
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-foreground">Add Product / Restock</h3>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              <Input placeholder="Product name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <Input placeholder="Sold" type="number" value={newSold} onChange={(e) => setNewSold(e.target.value)} />
              <Input placeholder="Revenue" type="number" value={newRevenue} onChange={(e) => setNewRevenue(e.target.value)} />
              <Input placeholder="Price per unit" type="number" value={newPricePerUnit} onChange={(e) => setNewPricePerUnit(e.target.value)} />
              <Input placeholder="Cost" type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
              <Input placeholder="Stock" type="number" value={newStock} onChange={(e) => setNewStock(e.target.value)} />
              <Input placeholder="Last restock days ago" type="number" value={newLastRestockDays} onChange={(e) => setNewLastRestockDays(e.target.value)} />
            </div>

            <div className="rounded-lg border border-border/70 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Smart Supplier Intelligence</p>
              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
                <Input placeholder="Quantity needed" type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
                <Input placeholder="Budget min (KES)" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                <Input placeholder="Budget max (KES)" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                <Input placeholder="Preferred location (optional)" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} />
                <div className="flex items-center gap-2">
                  {(["low", "medium", "high"] as QualityPreference[]).map((q) => (
                    <Button
                      key={q}
                      size="sm"
                      variant={qualityPreference === q ? "default" : "outline"}
                      className="capitalize"
                      onClick={() => setQualityPreference(q)}
                      type="button"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              {(Number(restockQty) > 0 && newCategory.trim()) && (
                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2">
                  <p>Want help choosing the best supplier? Based on your location and similar businesses.</p>
                  <Button size="sm" variant="outline" onClick={() => setShowSupplierPanel((prev) => !prev)}>
                    {showSupplierPanel ? "Hide Suggestions" : "View Suggestions"}
                  </Button>
                </div>
              )}

              {showSupplierPanel && rankedSuppliers.length > 0 && (
                <div className="space-y-3">
                  {rankedSuppliers.map((item) => {
                    const estimated = item.supplier.pricePerUnit * Math.max(1, currentRestockRequest.quantity);
                    const tierStyle = item.tier === 1
                      ? "border-primary/30 bg-primary/5"
                      : item.tier === 2
                        ? "border-amber-300/50 bg-amber-100/40"
                        : "border-border/70 bg-muted/30";
                    const tierLabel = item.tier === 1 ? "Tier 1 - Best Overall" : item.tier === 2 ? "Tier 2 - Best Value" : "Tier 3 - Backup";

                    return (
                      <div key={item.supplier.id} className={`rounded-lg border p-4 ${tierStyle}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{tierLabel}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedSupplierId === item.supplier.id ? "default" : "outline"}
                            onClick={() => {
                              setSelectedSupplierId(item.supplier.id);
                              setNewPricePerUnit(String(item.supplier.pricePerUnit));
                            }}
                            type="button"
                          >
                            {selectedSupplierId === item.supplier.id ? "Selected" : "Select Supplier"}
                          </Button>
                        </div>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-2 text-xs">
                          <p>Estimated cost: <span className="font-medium text-foreground">{formatKES(estimated)}</span></p>
                          <p>Quality: <span className="font-medium text-foreground">{item.supplier.qualityScore.toFixed(1)} / 5</span></p>
                          <p>Reliability: <span className="font-medium text-foreground">{item.supplier.reliabilityScore.toFixed(1)} / 5</span></p>
                          <p>Distance: <span className="font-medium text-foreground">{item.supplier.distanceKm} km</span></p>
                          <p>Used by: <span className="font-medium text-foreground">{item.supplier.usedBySimilarBusinesses} similar businesses</span></p>
                        </div>

                        <p className="text-sm text-foreground mt-2">{item.reason}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedSupplier && (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  Selected supplier: <span className="font-medium">{selectedSupplier.name}</span>. This option keeps your decision safer for current cash flow.
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">Trend is auto-monitored by the system based on stock, sell-through, price-per-unit consistency, and margin behavior.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={addProduct}>Save Product</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display text-lg font-semibold text-foreground">Smart Supplier Intelligence</h3>
          </div>
          <p className="text-sm text-muted-foreground">Quiet supplier guidance based on stock pressure, price movement, and local market trust signals.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {passiveSupplierInsights.map((entry) => (
              <div key={entry.product.id} className="rounded-lg border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{entry.product.name}</p>
                  <span className={`text-xs font-medium ${entry.trendClass}`}>Price trend: {entry.trendLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stock: {entry.product.stock} • Last restock: {entry.product.lastRestockDays} days ago
                </p>
                <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-sm">
                  Best supplier now: <span className="font-medium">{entry.best.supplier.name}</span> ({entry.best.supplier.market})
                </div>
                <p className="text-sm mt-2">Based on your cash flow this week, this supplier keeps you safest.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => applySupplierSuggestion(entry.product, entry.best.supplier, entry.quantity)}
                >
                  Use Suggestion
                </Button>
              </div>
            ))}
          </div>
        </div>

        {(lowStock.length > 0 || slowMoving.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {lowStock.length > 0 && (
              <div className="surface-card p-4 flex items-start gap-3 border-destructive/25 bg-destructive/5">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Low Stock Alert</h4>
                  <p className="text-xs text-muted-foreground mt-1">{lowStock.map((p) => `${p.name} (${p.stock} left)`).join(", ")}</p>
                </div>
              </div>
            )}
            {slowMoving.length > 0 && (
              <div className="surface-card p-4 flex items-start gap-3 border-warning/25 bg-warning/5">
                <TrendingDown className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Slow-Moving Products</h4>
                  <p className="text-xs text-muted-foreground mt-1">{slowMoving.map((p) => `${p.name} (${p.trend}%)`).join(", ")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="surface-card p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">Profit Per Product</h3>
          <p className="text-sm text-muted-foreground mb-6">Top 6 products by profit margin</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} stroke="hsl(160, 10%, 45%)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} stroke="hsl(160, 10%, 45%)" />
                <Tooltip formatter={(v: number) => formatKES(v)} />
                <Bar dataKey="profit" name="Profit" fill="hsl(152, 55%, 28%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">Watchlist Monitor</h3>
          <p className="text-sm text-muted-foreground mb-5">Track selected products only and receive automatic monitoring advice.</p>
          {watchlistProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
              No products in watchlist yet. Use the Watchlist column in the table to start tracking items.
            </div>
          ) : (
            <div className="space-y-3">
              {watchlistSorted.map((item) => {
                const insight = getWatchInsight(item);
                const isPinned = pinnedProducts.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedWatchProduct(item)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedWatchProduct(item)}
                    className="w-full text-left rounded-lg border border-border/70 p-4 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${insight.className}`}>{insight.label}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant={isPinned ? "default" : "outline"}
                          className="h-7 px-2 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinProduct(item.id);
                          }}
                        >
                          <Pin className="w-3 h-3" />
                          {isPinned ? "Pinned" : "Pin"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Trend {item.trend >= 0 ? "+" : ""}{item.trend}% • Stock {item.stock} • Sold {item.sold} • Price/Unit {formatKES(item.pricePerUnit)}
                    </p>
                    <p className="text-sm text-foreground">{insight.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="p-6 pb-0">
            <h3 className="font-display text-lg font-semibold text-foreground">All Products</h3>
          </div>
          <div className="overflow-x-auto p-6 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Sold</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Price / Unit</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trend</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Watchlist</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">-</th>
                </tr>
              </thead>
              <tbody>
                {computedProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-muted-foreground" /> {p.name}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{p.category}</td>
                    <td className="py-3 px-3 text-right text-foreground">{p.sold}</td>
                    <td className="py-3 px-3 text-right text-foreground">{formatKES(p.revenue)}</td>
                    <td className="py-3 px-3 text-right text-foreground">
                      {editingPriceProductId === p.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="h-8 w-28 text-right"
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => saveEditPrice(p.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2" onClick={cancelEditPrice}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span>{formatKES(p.pricePerUnit)}</span>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => startEditPrice(p)}>
                            Edit
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right hidden md:table-cell">
                      <Badge variant="secondary" className={p.stock < 20 ? "bg-destructive/10 text-destructive" : ""}>{p.stock}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${p.trend >= 0 ? "text-primary" : "text-destructive"}`}>
                        {p.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {p.trend >= 0 ? "+" : ""}{p.trend}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        type="button"
                        variant={watchlist.includes(p.id) ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => toggleWatchlist(p.id)}
                      >
                        {watchlist.includes(p.id) ? "Watching" : "Add"}
                      </Button>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setProductToDelete(p)}
                        aria-label={`Remove ${p.name}`}
                      >
                        -
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to remove this product: <span className="font-medium text-foreground">{productToDelete?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && removeProduct(productToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedWatchProduct} onOpenChange={(open) => !open && setSelectedWatchProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedWatchProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedWatchProduct.name} Analytics</DialogTitle>
                <DialogDescription>
                  Live watchlist monitoring for this product with trend behavior, weekly movement, and guidance.
                </DialogDescription>
              </DialogHeader>

              <div className="grid sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">Sold</p>
                  <p className="text-lg font-semibold text-foreground">{selectedWatchProduct.sold}</p>
                </div>
                <div className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold text-foreground">{formatKES(selectedWatchProduct.revenue)}</p>
                </div>
                <div className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">Price / Unit</p>
                  <p className="text-lg font-semibold text-foreground">{formatKES(selectedWatchProduct.pricePerUnit)}</p>
                </div>
                <div className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">Trend (Auto)</p>
                  <p className={`text-lg font-semibold ${selectedWatchProduct.trend >= 0 ? "text-primary" : "text-destructive"}`}>
                    {selectedWatchProduct.trend >= 0 ? "+" : ""}{selectedWatchProduct.trend}%
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Weekly Sales Behavior</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={buildWeeklySeries(selectedWatchProduct)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(160, 10%, 45%)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(160, 10%, 45%)" />
                        <Tooltip />
                        <Bar dataKey="sold" name="Units Sold" fill="hsl(152, 55%, 28%)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Estimated Margin Trend</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={buildMarginSeries(selectedWatchProduct)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 88%)" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(160, 10%, 45%)" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(160, 10%, 45%)" />
                        <Tooltip formatter={(value: number) => formatKES(value)} />
                        <Line type="monotone" dataKey="margin" stroke="hsl(38, 85%, 45%)" strokeWidth={2.2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground mb-2">Commentary & Insights</p>
                <div className="space-y-2">
                  {productComments(selectedWatchProduct).map((comment) => (
                    <p key={comment} className="text-sm text-foreground">{comment}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showPremiumPrompt} onOpenChange={setShowPremiumPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Premium Required</AlertDialogTitle>
            <AlertDialogDescription>
              You can pin up to {MAX_PINNED_PRODUCTS} products on the watchlist.
              To pin additional products, please pay for Premium Services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowPremiumPrompt(false)}>
              Upgrade to Premium
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ProductsPage;
