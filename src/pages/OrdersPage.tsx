import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { demoRecentTransactions, formatKES } from "@/lib/demo-data";

const allOrders = [
  ...demoRecentTransactions,
  { id: "TXN-007", customer: "Grace Akinyi", amount: 9800, date: "2026-02-18", status: "completed", method: "M-Pesa" },
  { id: "TXN-008", customer: "John Mwangi", amount: 15400, date: "2026-02-18", status: "completed", method: "Card" },
  { id: "TXN-009", customer: "Lucy Wambui", amount: 7200, date: "2026-02-17", status: "pending", method: "M-Pesa" },
  { id: "TXN-010", customer: "Michael Otieno", amount: 22100, date: "2026-02-17", status: "completed", method: "M-Pesa" },
  { id: "TXN-011", customer: "Nancy Chebet", amount: 4500, date: "2026-02-16", status: "completed", method: "Card" },
  { id: "TXN-012", customer: "Robert Kipchoge", amount: 19800, date: "2026-02-16", status: "failed", method: "M-Pesa" },
];

const statusStyles: Record<string, string> = {
  completed: "bg-primary/10 text-primary hover:bg-primary/15",
  pending: "bg-warning/10 text-warning hover:bg-warning/15",
  failed: "bg-destructive/10 text-destructive hover:bg-destructive/15",
};

const OrdersPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = allOrders.filter((o) => {
    const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Orders" subtitle="View and manage all transactions">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by customer or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            {["all", "completed", "pending", "failed"].map((s) => (
              <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b soft-divider bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{order.id}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{order.customer}</td>
                    <td className="py-3 px-4 text-foreground">{formatKES(order.amount)}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{order.method}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{order.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className={statusStyles[order.status]}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No orders found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
