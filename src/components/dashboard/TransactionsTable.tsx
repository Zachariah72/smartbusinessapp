import { demoRecentTransactions, formatKES } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  completed: "bg-primary/10 text-primary hover:bg-primary/15",
  pending: "bg-warning/10 text-warning hover:bg-warning/15",
  failed: "bg-destructive/10 text-destructive hover:bg-destructive/15",
};

const TransactionsTable = () => (
  <div className="surface-card p-6">
    <h3 className="font-display text-lg font-semibold text-foreground mb-1">Recent Transactions</h3>
    <p className="text-sm text-muted-foreground mb-6">Latest payment activity</p>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b soft-divider">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Customer</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Amount</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Date</th>
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {demoRecentTransactions.map((txn) => (
            <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-3 px-2 font-medium text-foreground">{txn.customer}</td>
              <td className="py-3 px-2 text-foreground">{formatKES(txn.amount)}</td>
              <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{txn.method}</td>
              <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{txn.date}</td>
              <td className="py-3 px-2">
                <Badge variant="secondary" className={statusStyles[txn.status]}>
                  {txn.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TransactionsTable;
