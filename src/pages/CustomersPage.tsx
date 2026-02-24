import { useState } from "react";
import { Search, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useBusinessData } from "@/context/BusinessDataContext";

const demoCustomers = [
  { name: "Amina Wanjiku", email: "amina@email.com", phone: "+254 712 345 678", orders: 24, spent: 156000, lastOrder: "2026-02-21", tier: "Gold" },
  { name: "James Ochieng", email: "james.o@email.com", phone: "+254 723 456 789", orders: 18, spent: 98000, lastOrder: "2026-02-21", tier: "Silver" },
  { name: "Faith Muthoni", email: "faith.m@email.com", phone: "+254 734 567 890", orders: 32, spent: 245000, lastOrder: "2026-02-20", tier: "Gold" },
  { name: "Peter Kamau", email: "peter.k@email.com", phone: "+254 745 678 901", orders: 8, spent: 42000, lastOrder: "2026-02-20", tier: "Bronze" },
  { name: "Sarah Njeri", email: "sarah.n@email.com", phone: "+254 756 789 012", orders: 15, spent: 87000, lastOrder: "2026-02-19", tier: "Silver" },
  { name: "David Mutua", email: "david.m@email.com", phone: "+254 767 890 123", orders: 41, spent: 312000, lastOrder: "2026-02-19", tier: "Gold" },
  { name: "Grace Akinyi", email: "grace.a@email.com", phone: "+254 778 901 234", orders: 5, spent: 28000, lastOrder: "2026-02-18", tier: "Bronze" },
  { name: "John Mwangi", email: "john.mw@email.com", phone: "+254 789 012 345", orders: 22, spent: 178000, lastOrder: "2026-02-18", tier: "Silver" },
];

const tierStyles: Record<string, string> = {
  Gold: "bg-warning/10 text-warning",
  Silver: "bg-muted text-muted-foreground",
  Bronze: "bg-accent/10 text-accent-foreground",
};

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const { routedClients } = useBusinessData();
  const inferredCustomers = routedClients.map((client) => ({
    name: client.name,
    email: "from-upload@local",
    phone: client.phone || "N/A",
    orders: 1,
    spent: Math.round(client.totalSpent),
    lastOrder: client.firstSeen,
    tier: client.totalSpent >= 150000 ? "Gold" : client.totalSpent >= 70000 ? "Silver" : "Bronze",
  }));
  const mergedCustomers = [...inferredCustomers, ...demoCustomers];
  const uniqueCustomers = mergedCustomers.filter((customer, idx, arr) => {
    const key = customer.name.toLowerCase();
    return arr.findIndex((c) => c.name.toLowerCase() === key) === idx;
  });
  const filtered = uniqueCustomers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout title="Customers" subtitle="Manage your customer relationships">
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((customer) => (
            <div key={customer.email} className="surface-card p-5 hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {customer.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <Badge variant="secondary" className={tierStyles[customer.tier]}>{customer.tier}</Badge>
              </div>
              <h3 className="font-medium text-foreground mb-1">{customer.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground mb-3">
                <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</p>
              </div>
              <div className="flex justify-between text-xs border-t border-border pt-3">
                <div><span className="text-muted-foreground">Orders</span><p className="font-semibold text-foreground">{customer.orders}</p></div>
                <div className="text-right"><span className="text-muted-foreground">Total Spent</span><p className="font-semibold text-foreground">KES {(customer.spent / 1000).toFixed(0)}K</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomersPage;
