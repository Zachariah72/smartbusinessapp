import { useState } from "react";
import { Target, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { formatKES } from "@/lib/demo-data";

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  period: string;
}

const initialGoals: Goal[] = [
  { id: "1", title: "Monthly Revenue", target: 700000, current: 580000, unit: "KES", period: "February 2026" },
  { id: "2", title: "Total Orders", target: 200, current: 195, unit: "orders", period: "February 2026" },
  { id: "3", title: "New Customers", target: 50, current: 32, unit: "customers", period: "February 2026" },
  { id: "4", title: "Sales Growth", target: 20, current: 18.5, unit: "%", period: "Q1 2026" },
];

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const addGoal = () => {
    if (!newTitle || !newTarget) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newTitle,
      target: parseFloat(newTarget),
      current: 0,
      unit: "KES",
      period: "February 2026",
    };
    setGoals((prev) => [...prev, goal]);
    setNewTitle("");
    setNewTarget("");
    setShowAdd(false);
  };

  return (
    <DashboardLayout title="Goal Tracking" subtitle="Set targets and track your progress">
      <div className="space-y-6 max-w-3xl">
        {/* Add Goal */}
        <div className="flex justify-end">
          <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>

        {showAdd && (
          <div className="bg-card rounded-xl p-6 shadow-card space-y-4 animate-fade-in">
            <h3 className="font-display text-base font-semibold text-foreground">New Goal</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input placeholder="Goal title (e.g. Monthly Revenue)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              <Input placeholder="Target value" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
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
              <div key={goal.id} className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {goal.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{goal.period}</p>
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
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;
