import { useState } from "react";
import { Target, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { formatKES } from "@/lib/demo-data";
import { Textarea } from "@/components/ui/textarea";

interface Goal {
  id: string;
  title: string;
  category: string;
  metric: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  owner: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  budget: number;
  reminderFrequency: string;
  milestones: string[];
  riskNotes: string;
  notes: string;
}

const initialGoals: Goal[] = [
  {
    id: "1",
    title: "Monthly Revenue",
    category: "Sales",
    metric: "Revenue",
    baseline: 580000,
    target: 700000,
    current: 580000,
    unit: "KES",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    owner: "Owner",
    priority: "High",
    budget: 0,
    reminderFrequency: "Weekly",
    milestones: ["Hit KES 620,000 by week 2", "Hit KES 660,000 by week 3"],
    riskNotes: "Weekend stock-outs",
    notes: "Focus on best-selling bundles",
  },
  {
    id: "2",
    title: "Total Orders",
    category: "Operations",
    metric: "Orders",
    baseline: 160,
    target: 200,
    current: 195,
    unit: "orders",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    owner: "Manager",
    priority: "Medium",
    budget: 0,
    reminderFrequency: "Weekly",
    milestones: ["Reach 180 orders by week 3"],
    riskNotes: "",
    notes: "",
  },
  {
    id: "3",
    title: "New Customers",
    category: "Customers",
    metric: "New Customers",
    baseline: 20,
    target: 50,
    current: 32,
    unit: "customers",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    owner: "Sales Team",
    priority: "Medium",
    budget: 10000,
    reminderFrequency: "Weekly",
    milestones: ["30 new customers by mid-month"],
    riskNotes: "Slow weekday foot traffic",
    notes: "Run referral push",
  },
  {
    id: "4",
    title: "Sales Growth",
    category: "Finance",
    metric: "Growth Rate",
    baseline: 12,
    target: 20,
    current: 18.5,
    unit: "%",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    owner: "Owner",
    priority: "High",
    budget: 25000,
    reminderFrequency: "Bi-weekly",
    milestones: ["15% by end of February"],
    riskNotes: "Supplier delays",
    notes: "Maintain offer cadence",
  },
];

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "Sales",
    metric: "Revenue",
    baseline: "",
    target: "",
    current: "0",
    unit: "KES",
    startDate: "",
    endDate: "",
    owner: "",
    priority: "Medium" as Goal["priority"],
    budget: "",
    reminderFrequency: "Weekly",
    milestones: "",
    riskNotes: "",
    notes: "",
  });

  const addGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.startDate || !newGoal.endDate || !newGoal.owner) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      category: newGoal.category,
      metric: newGoal.metric,
      baseline: Number(newGoal.baseline || 0),
      target: Number(newGoal.target || 0),
      current: Number(newGoal.current || 0),
      unit: newGoal.unit,
      startDate: newGoal.startDate,
      endDate: newGoal.endDate,
      owner: newGoal.owner,
      priority: newGoal.priority,
      budget: Number(newGoal.budget || 0),
      reminderFrequency: newGoal.reminderFrequency,
      milestones: newGoal.milestones.split(",").map((item) => item.trim()).filter(Boolean),
      riskNotes: newGoal.riskNotes,
      notes: newGoal.notes,
    };
    setGoals((prev) => [...prev, goal]);
    setNewGoal({
      title: "",
      category: "Sales",
      metric: "Revenue",
      baseline: "",
      target: "",
      current: "0",
      unit: "KES",
      startDate: "",
      endDate: "",
      owner: "",
      priority: "Medium",
      budget: "",
      reminderFrequency: "Weekly",
      milestones: "",
      riskNotes: "",
      notes: "",
    });
    setShowAdd(false);
  };

  return (
    <DashboardLayout title="Goal Tracking" subtitle="Set targets and track your progress">
      <div className="space-y-6 w-full">
        {/* Add Goal */}
        <div className="flex justify-end">
          <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>

        {showAdd && (
          <div className="surface-card p-6 space-y-4 animate-fade-in">
            <h3 className="font-display text-base font-semibold text-foreground">New Goal</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input placeholder="Goal title" value={newGoal.title} onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))} />
              <Input placeholder="Category (Sales, Stock, Clients...)" value={newGoal.category} onChange={(e) => setNewGoal((prev) => ({ ...prev, category: e.target.value }))} />
              <Input placeholder="Metric (Revenue, Orders, Growth...)" value={newGoal.metric} onChange={(e) => setNewGoal((prev) => ({ ...prev, metric: e.target.value }))} />
              <Input placeholder="Baseline value" type="number" value={newGoal.baseline} onChange={(e) => setNewGoal((prev) => ({ ...prev, baseline: e.target.value }))} />
              <Input placeholder="Target value" type="number" value={newGoal.target} onChange={(e) => setNewGoal((prev) => ({ ...prev, target: e.target.value }))} />
              <Input placeholder="Current value" type="number" value={newGoal.current} onChange={(e) => setNewGoal((prev) => ({ ...prev, current: e.target.value }))} />
              <Input placeholder="Unit (KES, %, orders, customers)" value={newGoal.unit} onChange={(e) => setNewGoal((prev) => ({ ...prev, unit: e.target.value }))} />
              <Input placeholder="Owner (person/team)" value={newGoal.owner} onChange={(e) => setNewGoal((prev) => ({ ...prev, owner: e.target.value }))} />
              <Input placeholder="Priority (Low/Medium/High/Critical)" value={newGoal.priority} onChange={(e) => setNewGoal((prev) => ({ ...prev, priority: (e.target.value || "Medium") as Goal["priority"] }))} />
              <Input placeholder="Start date" type="date" value={newGoal.startDate} onChange={(e) => setNewGoal((prev) => ({ ...prev, startDate: e.target.value }))} />
              <Input placeholder="End date" type="date" value={newGoal.endDate} onChange={(e) => setNewGoal((prev) => ({ ...prev, endDate: e.target.value }))} />
              <Input placeholder="Budget (KES)" type="number" value={newGoal.budget} onChange={(e) => setNewGoal((prev) => ({ ...prev, budget: e.target.value }))} />
              <Input placeholder="Reminder frequency (Daily/Weekly/Bi-weekly/Monthly)" value={newGoal.reminderFrequency} onChange={(e) => setNewGoal((prev) => ({ ...prev, reminderFrequency: e.target.value }))} className="lg:col-span-2" />
              <Input placeholder="Milestones (comma-separated)" value={newGoal.milestones} onChange={(e) => setNewGoal((prev) => ({ ...prev, milestones: e.target.value }))} className="lg:col-span-3" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Textarea placeholder="Risk notes (what might block this goal?)" value={newGoal.riskNotes} onChange={(e) => setNewGoal((prev) => ({ ...prev, riskNotes: e.target.value }))} />
              <Textarea placeholder="Execution notes (plan/strategy)" value={newGoal.notes} onChange={(e) => setNewGoal((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={addGoal} size="sm">Save Goal</Button>
              <Button onClick={() => setShowAdd(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = pct >= 100;
            const isBehind = pct < 70;

            return (
              <div key={goal.id} className="surface-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {goal.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {goal.startDate} to {goal.endDate} · {goal.category} · Owner: {goal.owner}
                    </p>
                  </div>
                  {isComplete ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> Goal reached! 🎉
                    </div>
                  ) : isBehind ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Behind target
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {goal.unit === "KES" ? formatKES(goal.current) : `${goal.current} ${goal.unit}`}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {goal.unit === "KES" ? formatKES(goal.target) : `${goal.target} ${goal.unit}`}
                  </span>
                </div>
                <Progress value={pct} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-right">{pct.toFixed(1)}% complete</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Metric: <span className="text-foreground">{goal.metric}</span></p>
                  <p>Priority: <span className="text-foreground">{goal.priority}</span></p>
                  <p>Baseline: <span className="text-foreground">{goal.unit === "KES" ? formatKES(goal.baseline) : `${goal.baseline} ${goal.unit}`}</span></p>
                  <p>Budget: <span className="text-foreground">{formatKES(goal.budget)}</span></p>
                  <p className="sm:col-span-2">Reminder: <span className="text-foreground">{goal.reminderFrequency}</span></p>
                  {goal.milestones.length > 0 && (
                    <p className="sm:col-span-2">Milestones: <span className="text-foreground">{goal.milestones.join(" • ")}</span></p>
                  )}
                  {goal.riskNotes && (
                    <p className="sm:col-span-2">Risk: <span className="text-foreground">{goal.riskNotes}</span></p>
                  )}
                  {goal.notes && (
                    <p className="sm:col-span-2">Notes: <span className="text-foreground">{goal.notes}</span></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;
