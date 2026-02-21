import { TrendingUp, TrendingDown, AlertTriangle, Package as PackageIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { formatKES } from "@/lib/demo-data";

const products = [
  { name: "Premium Coffee Beans", category: "Beverages", sold: 456, revenue: 684000, cost: 342000, stock: 120, trend: 12 },
  { name: "Organic Tea Collection", category: "Beverages", sold: 382, revenue: 573000, cost: 287000, stock: 85, trend: 8 },
  { name: "Fresh Juice Pack", category: "Beverages", sold: 298, revenue: 447000, cost: 268000, stock: 45, trend: -3 },
  { name: "Snack Bundle", category: "Food", sold: 267, revenue: 400500, cost: 200000, stock: 200, trend: 15 },
  { name: "Water Bottles (12pk)", category: "Beverages", sold: 234, revenue: 280800, cost: 140000, stock: 350, trend: 5 },
  { name: "Maize Flour 2kg", category: "Food", sold: 189, revenue: 189000, cost: 132000, stock: 15, trend: -8 },
  { name: "Cooking Oil 1L", category: "Food", sold: 156, revenue: 234000, cost: 156000, stock: 8, trend: 2 },
  { name: "Sugar 1kg", category: "Food", sold: 134, revenue: 107200, cost: 80400, stock: 5, trend: -12 },
];

const chartData = products.slice(0, 6).map((p) => ({
  name: p.name.length > 12 ? p.name.substring(0, 12) + "…" : p.name,
  profit: p.revenue - p.cost,
  revenue: p.revenue,
}));

const lowStock = products.filter((p) => p.stock < 20);
const slowMoving = products.filter((p) => p.trend < 0);

const ProductsPage = () => (
  <DashboardLayout title="Product Analytics" subtitle="Track product performance and inventory">
    <div className="space-y-6">
      {/* Alerts */}
      {(lowStock.length > 0 || slowMoving.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {lowStock.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Low Stock Alert</h4>
                <p className="text-xs text-muted-foreground mt-1">{lowStock.map((p) => `${p.name} (${p.stock} left)`).join(", ")}</p>
              </div>
            </div>
          )}
          {slowMoving.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground text-sm">Slow-Moving Products</h4>
                <p className="text-xs text-muted-foreground mt-1">{slowMoving.map((p) => `${p.name} (${p.trend}%)`).join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profit Chart */}
      <div className="bg-card rounded-xl p-6 shadow-card">
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

      {/* Products Table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
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
                <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trend</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-muted-foreground" /> {p.name}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">{p.category}</td>
                  <td className="py-3 px-3 text-right text-foreground">{p.sold}</td>
                  <td className="py-3 px-3 text-right text-foreground">{formatKES(p.revenue)}</td>
                  <td className="py-3 px-3 text-right hidden md:table-cell">
                    <Badge variant="secondary" className={p.stock < 20 ? "bg-destructive/10 text-destructive" : ""}>{p.stock}</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${p.trend >= 0 ? "text-primary" : "text-destructive"}`}>
                      {p.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {p.trend >= 0 ? "+" : ""}{p.trend}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default ProductsPage;
