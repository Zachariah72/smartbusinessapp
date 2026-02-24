import { demoTopProducts, formatKES } from "@/lib/demo-data";
import { TrendingUp, TrendingDown } from "lucide-react";

const TopProducts = () => (
  <div className="surface-card p-6">
    <h3 className="font-display text-lg font-semibold text-foreground mb-1">Top Products</h3>
    <p className="text-sm text-muted-foreground mb-6">Best performers this month</p>
    <div className="space-y-4">
      {demoTopProducts.map((product, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sales} sales</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{formatKES(product.revenue)}</p>
            <p className={`text-xs flex items-center gap-0.5 justify-end ${product.trend >= 0 ? "text-primary" : "text-destructive"}`}>
              {product.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {product.trend >= 0 ? "+" : ""}{product.trend}%
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TopProducts;
