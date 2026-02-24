import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  demoMonthlyRevenueExpenses,
  demoMonthlySales,
  demoWeeklyData,
  demoWeeklyRevenueExpenses,
  demoYearlyRevenueExpenses,
  demoYearlySales,
  kpis,
} from "@/lib/demo-data";
import {
  parseFileRows,
  runIngestionPipeline,
  type LedgerEntry,
  type NormalizedTransaction,
  type RoutedClient,
  type RoutedProduct,
  type RoutedSupplier,
} from "@/lib/data-ingestion";

export interface UploadRecord {
  id: string;
  name: string;
  size: string;
  status: "processing" | "success" | "error";
  rowsProcessed: number;
  rowsSkipped: number;
  duplicatesSkipped: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  uploadedAt: string;
}

interface MetricsSnapshot {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  growthPercentage: number;
  conversionRate: number;
  todayCashIn: number;
  todayCashOut: number;
  monthCashIn: number;
  monthCashOut: number;
  ledgerProfit: number;
}

export interface RevenueExpensePoint {
  label: string;
  revenue: number;
  expenses: number;
}

export interface SalesPoint {
  label: string;
  sales: number;
}

interface PaymentBreakdownItem {
  key: string;
  totalAmount: number;
  transactionCost: number;
  count: number;
}

interface SalesRecordRow {
  id: string;
  date: string;
  recordedAt: string;
  amount: number;
  transactionCost: number;
  netAmount: number;
  referenceCode: string;
  paymentMode: string;
  paymentChannel: string;
  source: string;
}

type ReviewEntityKind = "product" | "client" | "supplier";
type ReviewStatus = "pending" | "approved" | "rejected";

interface ReviewQueueItem {
  id: string;
  kind: ReviewEntityKind;
  name: string;
  confidence: number;
  riskLevel: "Trusted" | "Needs Review" | "Risky";
  sourceFile: string;
  rowNumber: number;
  traceKey: string;
  status: ReviewStatus;
  payload: RoutedProduct | RoutedClient | RoutedSupplier;
}

interface PosConnection {
  provider: string;
  endpoint: string;
  connected: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: "idle" | "syncing" | "success" | "error";
  lastSyncMessage: string;
  totalSynced: number;
}

interface BusinessDataContextValue {
  ledgerEntries: LedgerEntry[];
  normalizedTransactions: NormalizedTransaction[];
  uploads: UploadRecord[];
  metrics: MetricsSnapshot;
  stockPurchaseSpend: number;
  analyticsData: {
    weekly: RevenueExpensePoint[];
    monthly: RevenueExpensePoint[];
    yearly: RevenueExpensePoint[];
  };
  salesData: {
    weekly: SalesPoint[];
    monthly: SalesPoint[];
    yearly: SalesPoint[];
  };
  paymentBreakdown: PaymentBreakdownItem[];
  recentSalesRecords: SalesRecordRow[];
  routedProducts: RoutedProduct[];
  routedClients: RoutedClient[];
  routedSuppliers: RoutedSupplier[];
  reviewQueue: ReviewQueueItem[];
  posConnection: PosConnection;
  ingestFiles: (files: FileList | File[] | null) => Promise<void>;
  dismissUpload: (id: string) => void;
  connectPos: (config: { provider: string; endpoint: string }) => void;
  disconnectPos: () => void;
  syncPosTransactions: (apiKey?: string) => Promise<void>;
  approveReviewItem: (id: string) => void;
  rejectReviewItem: (id: string) => void;
}

const STORAGE_KEY = "bia.business-data-engine";

const BusinessDataContext = createContext<BusinessDataContextValue | undefined>(undefined);

const formatKb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;
const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getWeekStartSunday = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
};

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const aggregateLedger = (entries: LedgerEntry[], from: Date, to: Date) => {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return entries.filter((entry) => {
    const t = new Date(entry.date).getTime();
    return t >= fromMs && t <= toMs;
  });
};

const buildTraceKeyFromPos = (entry: {
  date: string;
  amount: number;
  type: "IN" | "OUT";
  reference: string;
  rowNumber: number;
}) => [entry.date, entry.amount.toFixed(2), entry.type, entry.reference, entry.rowNumber].join("|");

const inferPaymentChannelFromAny = (mode: string, channel: string, description: string) => {
  const raw = `${mode} ${channel} ${description}`.toLowerCase();
  if (raw.includes("pochi")) return "Mobile Transfer";
  if (raw.includes("paybill")) return "Mobile Transfer";
  if (raw.includes("till") || raw.includes("buy goods")) return "Mobile Transfer";
  if (raw.includes("mpesa") || raw.includes("m-pesa")) return "Mobile Transfer";
  if (raw.includes("card")) return "Bank";
  if (raw.includes("cash")) return "Cash";
  if (raw.includes("bank")) return "Bank";
  if (raw.includes("wallet")) return "Mobile Transfer";
  if (raw.includes("mobile") || raw.includes("transfer")) return "Mobile Transfer";
  return channel || mode || "Unknown";
};

const KNOWN_PAYMENT_TERMS = ["m-pesa", "mpesa", "till", "paybill", "pochi", "cash", "card", "bank", "wallet", "mobile", "transfer", "pos"];
const NOISE_TERMS = ["%pdf", "obj", "flatedecode", "fontbbox", "capheight", "italicangle", "startxref", "endobj", "stream"];

const readableRatio = (value: string) => {
  if (!value) return 0;
  let readable = 0;
  for (const char of value) {
    const code = char.charCodeAt(0);
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) readable += 1;
  }
  return readable / value.length;
};

const normalizePaymentLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "Unknown";
  const lower = trimmed.toLowerCase();
  if (NOISE_TERMS.some((term) => lower.includes(term))) return "Unknown";
  if (readableRatio(trimmed) < 0.85) return "Unknown";
  if (lower.includes("cash")) return "Cash";
  if (lower.includes("bank") || lower.includes("card") || lower.includes("cheque")) return "Bank";
  if (lower.includes("mpesa") || lower.includes("m-pesa") || lower.includes("mobile") || lower.includes("transfer") || lower.includes("pochi") || lower.includes("paybill") || lower.includes("till") || lower.includes("wallet")) {
    return "Mobile Transfer";
  }
  return "Unknown";
};

const isValidReferenceCode = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "N/A") return false;
  if (readableRatio(trimmed) < 0.7) return false;
  if (NOISE_TERMS.some((term) => trimmed.toLowerCase().includes(term))) return false;
  return /^[A-Za-z0-9-]{5,20}$/.test(trimmed);
};

const isCleanTransactionRecord = (item: NormalizedTransaction) => {
  if (item.cashIn <= 0 && item.cashOut <= 0) return false;
  if (item.cashIn > 5_000_000 || item.cashOut > 5_000_000) return false;

  const mode = normalizePaymentLabel(item.paymentMode || "");
  const channel = normalizePaymentLabel(item.paymentChannel || "");
  const referenceOk = isValidReferenceCode(item.referenceCode || "");
  const desc = (item.description || "").toLowerCase();
  const descSignal = KNOWN_PAYMENT_TERMS.some((term) => desc.includes(term)) || /sale|sold|received|paid|payment|expense|credit|debit|stock|rent|utility|transport/.test(desc);
  const hasNoise = NOISE_TERMS.some((term) => desc.includes(term));
  if (hasNoise) return false;
  if (desc && readableRatio(desc) < 0.7 && !referenceOk) return false;
  if ((mode === "Unknown" && channel === "Unknown") && !referenceOk && !descSignal) return false;
  if (!descSignal && !referenceOk && (item.cashIn < 100 && item.cashOut < 100)) return false;
  return true;
};

const getDemoPosTransactions = () => {
  const today = new Date();
  return [
    {
      date: toIsoDate(today),
      amount: 17800,
      type: "IN" as const,
      orders: 4,
      description: "M-Pesa Till sale",
      reference: "QDA12F9K",
      transactionCost: 58,
      paymentMode: "Mobile Transfer",
      paymentChannel: "Mobile Transfer",
    },
    {
      date: toIsoDate(today),
      amount: 6200,
      type: "IN" as const,
      orders: 2,
      description: "M-Pesa Paybill sale",
      reference: "QDA12J3M",
      transactionCost: 34,
      paymentMode: "Mobile Transfer",
      paymentChannel: "Mobile Transfer",
    },
    {
      date: toIsoDate(addDays(today, -1)),
      amount: 22900,
      type: "IN" as const,
      orders: 6,
      description: "M-Pesa Pochi sale",
      reference: "QDA11K8V",
      transactionCost: 75,
      paymentMode: "Mobile Transfer",
      paymentChannel: "Mobile Transfer",
    },
  ];
};

export const BusinessDataProvider = ({ children }: { children: ReactNode }) => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [normalizedTransactions, setNormalizedTransactions] = useState<NormalizedTransaction[]>([]);
  const [routedProducts, setRoutedProducts] = useState<RoutedProduct[]>([]);
  const [routedClients, setRoutedClients] = useState<RoutedClient[]>([]);
  const [routedSuppliers, setRoutedSuppliers] = useState<RoutedSupplier[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [posConnection, setPosConnection] = useState<PosConnection>({
    provider: "Generic POS",
    endpoint: "demo",
    connected: false,
    lastSyncAt: null,
    lastSyncStatus: "idle",
    lastSyncMessage: "",
    totalSynced: 0,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        ledgerEntries?: LedgerEntry[];
        normalizedTransactions?: NormalizedTransaction[];
        routedProducts?: RoutedProduct[];
        routedClients?: RoutedClient[];
        routedSuppliers?: RoutedSupplier[];
        reviewQueue?: ReviewQueueItem[];
        uploads?: UploadRecord[];
        posConnection?: PosConnection;
      };
      const incomingNormalized = Array.isArray(parsed.normalizedTransactions)
        ? parsed.normalizedTransactions
          .map((item) => {
            const channel = normalizePaymentLabel(item.paymentChannel || item.paymentMode || item.description || "");
            return { ...item, paymentChannel: channel, paymentMode: channel };
          })
          .filter(isCleanTransactionRecord)
        : [];
      const allowedTraces = new Set(incomingNormalized.map((item) => item.traceKey));
      if (Array.isArray(parsed.ledgerEntries)) {
        setLedgerEntries(parsed.ledgerEntries.filter((entry) => {
          if (entry.source === "pos") return true;
          const base = entry.traceKey.replace(/:(IN|OUT)$/i, "");
          return allowedTraces.has(base);
        }));
      }
      setNormalizedTransactions(incomingNormalized);
      if (Array.isArray(parsed.routedProducts)) setRoutedProducts(parsed.routedProducts.slice(0, 2000));
      if (Array.isArray(parsed.routedClients)) setRoutedClients(parsed.routedClients.slice(0, 2000));
      if (Array.isArray(parsed.routedSuppliers)) setRoutedSuppliers(parsed.routedSuppliers.slice(0, 2000));
      if (Array.isArray(parsed.reviewQueue)) setReviewQueue(parsed.reviewQueue.slice(0, 3000));
      if (Array.isArray(parsed.uploads)) setUploads(parsed.uploads);
      if (parsed.posConnection) setPosConnection(parsed.posConnection);
    } catch {
      // Ignore malformed storage and continue with defaults.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ledgerEntries,
        normalizedTransactions,
        routedProducts,
        routedClients,
        routedSuppliers,
        reviewQueue,
        uploads,
        posConnection,
      }),
    );
  }, [ledgerEntries, normalizedTransactions, routedProducts, routedClients, routedSuppliers, reviewQueue, uploads, posConnection]);

  const validNormalizedTransactions = useMemo(
    () => normalizedTransactions.filter(isCleanTransactionRecord),
    [normalizedTransactions],
  );

  const validTraceKeys = useMemo(
    () => new Set(validNormalizedTransactions.map((item) => item.traceKey)),
    [validNormalizedTransactions],
  );

  const validLedgerEntries = useMemo(
    () => ledgerEntries.filter((entry) => {
      if (entry.source === "pos") return true;
      const base = entry.traceKey.replace(/:(IN|OUT)$/i, "");
      return validTraceKeys.has(base);
    }),
    [ledgerEntries, validTraceKeys],
  );

  const metrics = useMemo<MetricsSnapshot>(() => {
    const now = new Date();
    const today = toIsoDate(now);
    const monthStart = toIsoDate(startOfMonth(now));

    const totals = validLedgerEntries.reduce(
      (acc, entry) => {
        if (entry.type === "IN") acc.in += entry.amount;
        if (entry.type === "OUT") acc.out += entry.amount;
        if (entry.date === today && entry.type === "IN") acc.todayIn += entry.amount;
        if (entry.date === today && entry.type === "OUT") acc.todayOut += entry.amount;
        if (entry.date >= monthStart && entry.type === "IN") acc.monthIn += entry.amount;
        if (entry.date >= monthStart && entry.type === "OUT") acc.monthOut += entry.amount;
        return acc;
      },
      { in: 0, out: 0, todayIn: 0, todayOut: 0, monthIn: 0, monthOut: 0 },
    );

    const uploadedOrders = validNormalizedTransactions.reduce((sum, item) => sum + item.orders, 0);
    const revenue = kpis.totalRevenue + totals.in;
    const profit = kpis.totalProfit + totals.in - totals.out;
    const orders = kpis.totalOrders + uploadedOrders;
    const baselineMonthlyRevenue = kpis.totalRevenue / 12;
    const monthGrowthSignal = baselineMonthlyRevenue === 0
      ? 0
      : ((totals.monthIn - baselineMonthlyRevenue) / baselineMonthlyRevenue) * 100;
    const growthPercentage = Math.max(-25, Math.min(45, kpis.growthPercentage + monthGrowthSignal * 0.3));

    const conversionLift = uploadedOrders === 0 ? 0 : Math.min(1.8, uploadedOrders / 1800);
    const conversionRate = Math.max(0.5, Number((kpis.conversionRate + conversionLift).toFixed(1)));

    return {
      totalRevenue: Math.round(revenue),
      totalProfit: Math.round(profit),
      totalOrders: Math.round(orders),
      growthPercentage: Number(growthPercentage.toFixed(1)),
      conversionRate,
      todayCashIn: Math.round(174000 + totals.todayIn),
      todayCashOut: Math.round(121000 + totals.todayOut),
      monthCashIn: Math.round(totals.monthIn),
      monthCashOut: Math.round(totals.monthOut),
      ledgerProfit: Math.round(totals.in - totals.out),
    };
  }, [validLedgerEntries, validNormalizedTransactions]);

  const stockPurchaseSpend = useMemo(() => {
    return validLedgerEntries
      .filter((entry) => entry.type === "OUT" && entry.category?.toLowerCase() === "stock purchase")
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [validLedgerEntries]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStartSunday(now);
    const weekEnd = addDays(weekStart, 6);
    const weekEntries = aggregateLedger(validLedgerEntries, weekStart, weekEnd);

    const weekBase = demoWeeklyRevenueExpenses.map((item) => ({ ...item }));
    weekEntries.forEach((entry) => {
      const idx = new Date(entry.date).getDay();
      if (entry.type === "IN") weekBase[idx].revenue += entry.amount;
      if (entry.type === "OUT") weekBase[idx].expenses += entry.amount;
    });

    const monthBase = demoMonthlyRevenueExpenses.map((item) => ({ ...item }));
    validLedgerEntries.forEach((entry) => {
      const date = new Date(entry.date);
      if (date.getFullYear() !== now.getFullYear()) return;
      const idx = date.getMonth();
      if (!monthBase[idx]) return;
      if (entry.type === "IN") monthBase[idx].revenue += entry.amount;
      if (entry.type === "OUT") monthBase[idx].expenses += entry.amount;
    });

    const yearBase = demoYearlyRevenueExpenses.map((item) => ({ ...item }));
    validLedgerEntries.forEach((entry) => {
      const year = String(new Date(entry.date).getFullYear());
      const idx = yearBase.findIndex((row) => row.label === year);
      if (idx < 0) return;
      if (entry.type === "IN") yearBase[idx].revenue += entry.amount;
      if (entry.type === "OUT") yearBase[idx].expenses += entry.amount;
    });

    return {
      weekly: weekBase,
      monthly: monthBase,
      yearly: yearBase,
    };
  }, [validLedgerEntries]);

  const salesData = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStartSunday(now);
    const weekEnd = addDays(weekStart, 6);
    const weekEntries = aggregateLedger(validLedgerEntries, weekStart, weekEnd);

    const weekBase = demoWeeklyData.map((item) => ({ label: item.day, sales: item.sales }));
    weekEntries.forEach((entry) => {
      if (entry.type !== "IN") return;
      const idx = new Date(entry.date).getDay();
      weekBase[idx].sales += entry.amount;
    });

    const monthBase = demoMonthlySales.map((item) => ({ ...item }));
    validLedgerEntries.forEach((entry) => {
      const date = new Date(entry.date);
      if (entry.type !== "IN" || date.getFullYear() !== now.getFullYear()) return;
      const idx = date.getMonth();
      if (!monthBase[idx]) return;
      monthBase[idx].sales += entry.amount;
    });

    const yearBase = demoYearlySales.map((item) => ({ ...item }));
    validLedgerEntries.forEach((entry) => {
      if (entry.type !== "IN") return;
      const year = String(new Date(entry.date).getFullYear());
      const idx = yearBase.findIndex((row) => row.label === year);
      if (idx < 0) return;
      yearBase[idx].sales += entry.amount;
    });

    return {
      weekly: weekBase,
      monthly: monthBase,
      yearly: yearBase,
    };
  }, [validLedgerEntries]);

  const paymentBreakdown = useMemo<PaymentBreakdownItem[]>(() => {
    const bucket = new Map<string, PaymentBreakdownItem>();
    validNormalizedTransactions
      .filter((item) => item.cashIn > 0)
      .forEach((item) => {
        const channel = normalizePaymentLabel(item.paymentChannel || item.paymentMode || "");
        const key = channel;
        const current = bucket.get(key) ?? { key, totalAmount: 0, transactionCost: 0, count: 0 };
        current.totalAmount += item.cashIn;
        current.transactionCost += item.transactionCost || 0;
        current.count += 1;
        bucket.set(key, current);
      });
    return Array.from(bucket.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [validNormalizedTransactions]);

  const recentSalesRecords = useMemo<SalesRecordRow[]>(() => {
    return validNormalizedTransactions
      .filter((item) => item.cashIn > 0)
      .slice(0, 25)
      .map((item) => ({
        id: item.id,
        date: item.date,
        recordedAt: item.recordedAt ?? new Date(`${item.date}T12:00:00`).toISOString(),
        amount: item.cashIn,
        transactionCost: item.transactionCost || 0,
        netAmount: item.cashIn - (item.transactionCost || 0),
        referenceCode: isValidReferenceCode(item.referenceCode || "") ? item.referenceCode : "N/A",
        paymentMode: normalizePaymentLabel(item.paymentChannel || item.paymentMode || ""),
        paymentChannel: normalizePaymentLabel(item.paymentChannel || item.paymentMode || ""),
        source: item.fileId,
      }));
  }, [validNormalizedTransactions]);

  const ingestFiles = async (files: FileList | File[] | null) => {
    if (!files) return;

    const fileList = Array.isArray(files) ? files : Array.from(files);
    if (fileList.length === 0) return;

    const runningTraceKeys = new Set(validNormalizedTransactions.map((item) => item.traceKey));

    for (const file of fileList) {
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setUploads((prev) => [{
        id: uploadId,
        name: file.name,
        size: formatKb(file.size),
        status: "processing",
        rowsProcessed: 0,
        rowsSkipped: 0,
        duplicatesSkipped: 0,
        errors: [],
        warnings: [],
        suggestions: [],
        uploadedAt: new Date().toISOString(),
      }, ...prev].slice(0, 50));

      try {
        const { headers, rows } = await parseFileRows(file);
        const result = runIngestionPipeline(file.name, headers, rows, runningTraceKeys);

        if (result.normalizedTransactions.length === 0 && result.invalidRows.length > 0) {
          const ingestionError = `No valid rows in ${file.name}.`;
          setUploads((prev) => prev.map((item) => (
            item.id === uploadId
              ? {
                ...item,
                status: "error",
                errors: [ingestionError, ...result.invalidRows.map((e) => `Row ${e.rowNumber}: ${e.message}`)].slice(0, 8),
                warnings: result.warnings.map((w) => `Row ${w.rowNumber}: ${w.message}`).slice(0, 8),
                suggestions: result.suggestions,
              }
              : item
          )));
          continue;
        }

        const cleanIncoming = result.normalizedTransactions.filter(isCleanTransactionRecord);
        if (result.normalizedTransactions.length > 0 && cleanIncoming.length === 0) {
          setUploads((prev) => prev.map((item) => (
            item.id === uploadId
              ? {
                ...item,
                status: "error",
                rowsProcessed: 0,
                rowsSkipped: result.normalizedTransactions.length,
                duplicatesSkipped: result.duplicatesSkipped,
                errors: ["No reliable transactions were detected in this file. Upload a clearer image/PDF or CSV export."],
                warnings: [],
                suggestions: result.suggestions,
              }
              : item
          )));
          continue;
        }
        const cleanTraceKeys = new Set(cleanIncoming.map((item) => item.traceKey));
        const uniqueProducts = result.products.filter((item) => item.name && item.name !== "Unknown");
        const uniqueClients = result.clients.filter((item) => item.name && item.name !== "Unknown");
        const uniqueSuppliers = result.suppliers.filter((item) => item.name && item.name !== "Unknown");
        const trustedProducts = uniqueProducts.filter((item) => item.riskLevel === "Trusted");
        const trustedClients = uniqueClients.filter((item) => item.riskLevel === "Trusted");
        const trustedSuppliers = uniqueSuppliers.filter((item) => item.riskLevel === "Trusted");
        const reviewItems: ReviewQueueItem[] = [
          ...uniqueProducts
            .filter((item) => item.riskLevel !== "Trusted")
            .map((item) => ({
              id: `review-product-${item.traceKey}`,
              kind: "product" as const,
              name: item.name,
              confidence: item.confidence,
              riskLevel: item.riskLevel,
              sourceFile: item.sourceFile,
              rowNumber: item.rowNumber,
              traceKey: item.traceKey,
              status: "pending" as const,
              payload: item,
            })),
          ...uniqueClients
            .filter((item) => item.riskLevel !== "Trusted")
            .map((item) => ({
              id: `review-client-${item.traceKey}`,
              kind: "client" as const,
              name: item.name,
              confidence: item.confidence,
              riskLevel: item.riskLevel,
              sourceFile: item.sourceFile,
              rowNumber: item.rowNumber,
              traceKey: item.traceKey,
              status: "pending" as const,
              payload: item,
            })),
          ...uniqueSuppliers
            .filter((item) => item.riskLevel !== "Trusted")
            .map((item) => ({
              id: `review-supplier-${item.traceKey}`,
              kind: "supplier" as const,
              name: item.name,
              confidence: item.confidence,
              riskLevel: item.riskLevel,
              sourceFile: item.sourceFile,
              rowNumber: item.rowNumber,
              traceKey: item.traceKey,
              status: "pending" as const,
              payload: item,
            })),
        ];

        setNormalizedTransactions((prev) => [...cleanIncoming, ...prev].filter(isCleanTransactionRecord).slice(0, 5000));
        setRoutedProducts((prev) => {
          const existing = new Set(prev.map((item) => item.traceKey));
          const incoming = trustedProducts.filter((item) => !existing.has(item.traceKey));
          return [...incoming, ...prev].slice(0, 2000);
        });
        setRoutedClients((prev) => {
          const existing = new Set(prev.map((item) => item.traceKey));
          const incoming = trustedClients.filter((item) => !existing.has(item.traceKey));
          return [...incoming, ...prev].slice(0, 2000);
        });
        setRoutedSuppliers((prev) => {
          const existing = new Set(prev.map((item) => item.traceKey));
          const incoming = trustedSuppliers.filter((item) => !existing.has(item.traceKey));
          return [...incoming, ...prev].slice(0, 2000);
        });
        setReviewQueue((prev) => {
          const existing = new Set(prev.map((item) => item.id));
          const incoming = reviewItems.filter((item) => !existing.has(item.id));
          return [...incoming, ...prev].slice(0, 3000);
        });
        setLedgerEntries((prev) => {
          const existing = new Set(prev.map((entry) => entry.traceKey));
          const uniqueIncoming = result.ledgerEntries.filter((entry) => {
            if (existing.has(entry.traceKey)) return false;
            const base = entry.traceKey.replace(/:(IN|OUT)$/i, "");
            return cleanTraceKeys.has(base) || entry.source === "pos";
          });
          return [...uniqueIncoming, ...prev].slice(0, 12000);
        });

        setUploads((prev) => prev.map((item) => (
          item.id === uploadId
            ? {
              ...item,
              status: "success",
              rowsProcessed: cleanIncoming.length,
              rowsSkipped: result.invalidRows.length + result.warnings.filter((w) => w.message.includes("Skipped row")).length,
              duplicatesSkipped: result.duplicatesSkipped,
              errors: result.invalidRows.map((e) => `Row ${e.rowNumber}: ${e.message}`).slice(0, 8),
              warnings: result.warnings.map((w) => `Row ${w.rowNumber}: ${w.message}`).slice(0, 8),
              suggestions: result.suggestions,
            }
            : item
        )));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to ingest file.";
        setUploads((prev) => prev.map((item) => (
          item.id === uploadId
            ? {
              ...item,
              status: "error",
              errors: [message],
            }
            : item
        )));
      }
    }
  };

  const connectPos = (config: { provider: string; endpoint: string }) => {
    setPosConnection((prev) => ({
      ...prev,
      provider: config.provider.trim() || "Generic POS",
      endpoint: config.endpoint.trim() || "demo",
      connected: true,
      lastSyncStatus: "idle",
      lastSyncMessage: "POS connected. Ready to sync.",
    }));
  };

  const disconnectPos = () => {
    setPosConnection((prev) => ({
      ...prev,
      connected: false,
      lastSyncStatus: "idle",
      lastSyncMessage: "POS disconnected.",
    }));
  };

  const syncPosTransactions = async (apiKey?: string) => {
    if (!posConnection.connected) {
      setPosConnection((prev) => ({ ...prev, lastSyncStatus: "error", lastSyncMessage: "Connect POS first." }));
      return;
    }

    setPosConnection((prev) => ({ ...prev, lastSyncStatus: "syncing", lastSyncMessage: "Syncing POS transactions..." }));

    try {
      const sourceRows = posConnection.endpoint === "demo"
        ? getDemoPosTransactions()
        : await (async () => {
          const headers: HeadersInit = { Accept: "application/json" };
          if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
          const response = await fetch(posConnection.endpoint, { headers });
          if (!response.ok) throw new Error(`POS request failed: ${response.status}`);
          const payload = await response.json();
          const rows = Array.isArray(payload) ? payload : payload?.transactions;
          if (!Array.isArray(rows)) throw new Error("POS payload must be an array or { transactions: [] }.");
          return rows as Array<Record<string, unknown>>;
        })();

      const traceKeys = new Set(ledgerEntries.map((item) => item.traceKey));
      const incomingLedger: LedgerEntry[] = [];
      const incomingNormalized: NormalizedTransaction[] = [];

      sourceRows.forEach((row, index) => {
        const rowNumber = index + 1;
        const dateValue = row.date ? String(row.date) : toIsoDate(new Date());
        const date = toIsoDate(new Date(dateValue));
        const amountRaw = Number(row.amount ?? 0);
        const amount = Math.abs(Number.isFinite(amountRaw) ? amountRaw : 0);
        if (amount <= 0) return;

        const typeRaw = String(row.type ?? "").toUpperCase();
        const isIn = typeRaw.includes("IN") || typeRaw.includes("SALE") || typeRaw.includes("CREDIT") || amountRaw > 0;
        const type: "IN" | "OUT" = isIn ? "IN" : "OUT";
        const reference = String(row.reference ?? row.id ?? `${posConnection.provider}-${rowNumber}`);
        const traceKey = buildTraceKeyFromPos({ date, amount, type, reference, rowNumber });
        if (traceKeys.has(traceKey)) return;
        traceKeys.add(traceKey);

        const orders = Math.max(0, Number(row.orders ?? (type === "IN" ? 1 : 0)));
        const description = String(row.description ?? `${posConnection.provider} sync`);
        const category = String(row.category ?? "POS");
        const transactionCost = Math.max(0, Number(row.transactionCost ?? row.transaction_cost ?? row.charge ?? 0));
        const rawMode = String(row.paymentMode ?? row.modeOfPayment ?? row.payment_method ?? "POS");
        const paymentChannel = normalizePaymentLabel(
          inferPaymentChannelFromAny(
            rawMode,
            String(row.paymentChannel ?? row.channel ?? ""),
            description,
          ),
        );
        const paymentMode = paymentChannel;
        const referenceCode = String(row.referenceCode ?? row.reference ?? row.transactionId ?? row.code ?? reference);

        if (paymentChannel === "Unknown" && !isValidReferenceCode(referenceCode)) {
          return;
        }

        incomingLedger.push({
          id: `pos-${reference}-${rowNumber}`,
          date,
          type,
          amount,
          source: "pos",
          reference,
          fileId: posConnection.provider,
          rowNumber,
          traceKey,
          category,
          transactionCost,
          referenceCode,
          paymentMode,
          paymentChannel,
        });

        incomingNormalized.push({
          id: `pos-n-${reference}-${rowNumber}`,
          date,
          recordedAt: new Date().toISOString(),
          cashIn: type === "IN" ? amount : 0,
          cashOut: type === "OUT" ? amount : 0,
          orders,
          source: "file_upload",
          fileId: posConnection.provider,
          rowNumber,
          reference,
          description,
          category,
          traceKey: `${traceKey}|normalized`,
          transactionCost,
          referenceCode,
          paymentMode,
          paymentChannel,
        });
      });

      if (incomingLedger.length > 0) {
        setLedgerEntries((prev) => [...incomingLedger, ...prev].slice(0, 12000));
        setNormalizedTransactions((prev) => [...incomingNormalized, ...prev].slice(0, 5000));
      }

      setPosConnection((prev) => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "success",
        lastSyncMessage: incomingLedger.length > 0
          ? `Synced ${incomingLedger.length} POS transactions.`
          : "No new POS transactions found.",
        totalSynced: prev.totalSynced + incomingLedger.length,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "POS sync failed.";
      setPosConnection((prev) => ({ ...prev, lastSyncStatus: "error", lastSyncMessage: message }));
    }
  };

  const dismissUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const approveReviewItem = (id: string) => {
    setReviewQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target || target.status !== "pending") return prev;
      const next = prev.map((item) => (item.id === id ? { ...item, status: "approved" } : item));
      if (target.kind === "product") {
        setRoutedProducts((list) => {
          const exists = list.some((item) => item.traceKey === target.traceKey);
          return exists ? list : [target.payload as RoutedProduct, ...list].slice(0, 2000);
        });
      } else if (target.kind === "client") {
        setRoutedClients((list) => {
          const exists = list.some((item) => item.traceKey === target.traceKey);
          return exists ? list : [target.payload as RoutedClient, ...list].slice(0, 2000);
        });
      } else {
        setRoutedSuppliers((list) => {
          const exists = list.some((item) => item.traceKey === target.traceKey);
          return exists ? list : [target.payload as RoutedSupplier, ...list].slice(0, 2000);
        });
      }
      return next;
    });
  };

  const rejectReviewItem = (id: string) => {
    setReviewQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: "rejected" } : item)));
  };

  const value: BusinessDataContextValue = {
    ledgerEntries: validLedgerEntries,
    normalizedTransactions: validNormalizedTransactions,
    uploads,
    metrics,
    stockPurchaseSpend,
    analyticsData,
    salesData,
    paymentBreakdown,
    recentSalesRecords,
    routedProducts,
    routedClients,
    routedSuppliers,
    reviewQueue,
    posConnection,
    ingestFiles,
    dismissUpload,
    connectPos,
    disconnectPos,
    syncPosTransactions,
    approveReviewItem,
    rejectReviewItem,
  };

  return <BusinessDataContext.Provider value={value}>{children}</BusinessDataContext.Provider>;
};

export const useBusinessData = () => {
  const context = useContext(BusinessDataContext);
  if (!context) {
    throw new Error("useBusinessData must be used within BusinessDataProvider");
  }
  return context;
};
