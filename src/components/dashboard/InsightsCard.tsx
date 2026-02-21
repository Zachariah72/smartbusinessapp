import { Lightbulb } from "lucide-react";

const insights = [
  {
    text: "Your Saturday sales are 40% higher than weekdays. Consider extending weekend hours.",
    type: "opportunity",
  },
  {
    text: "Revenue grew 18.5% compared to last quarter. You're on a strong upward trend!",
    type: "positive",
  },
  {
    text: "3 failed M-Pesa transactions detected. Follow up with customers to recover KES 31,200.",
    type: "action",
  },
];

const InsightsCard = () => (
  <div className="bg-card rounded-xl p-6 shadow-card">
    <div className="flex items-center gap-2 mb-4">
      <Lightbulb className="w-5 h-5 text-accent" />
      <h3 className="font-display text-lg font-semibold text-foreground">Smart Insights</h3>
    </div>
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-1.5 rounded-full bg-accent-gradient flex-shrink-0" />
          <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
        </div>
      ))}
    </div>
  </div>
);

export default InsightsCard;
