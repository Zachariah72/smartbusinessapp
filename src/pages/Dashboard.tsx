import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  BookOpen,
  Brain,
  CheckCircle2,
  CircleAlert,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  DollarSign,
  ShoppingCart,
  Activity,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { formatKES } from "@/lib/demo-data";
import { useSubscription } from "@/context/SubscriptionContext";
import { useBusinessData } from "@/context/BusinessDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ProductSalesChart, RevenueExpensesChart, SalesTrendChart, type AnalyticsPeriod } from "@/components/dashboard/Charts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import KPICard from "@/components/dashboard/KPICard";

const weeklyStory =
  "In June, you survived cash pressure and learned pricing discipline. Weekend demand stayed strong, but transport and stock timing pulled energy from the week.";

const milestones = [
  "First profitable week",
  "First 100 customers",
  "First calm month",
];

type MemoryCategory = "decision" | "stress" | "cashflow" | "operations";

interface MemoryRecord {
  id: string;
  date: string;
  category: MemoryCategory;
  title: string;
  note: string;
}

type CashEntryType = "in" | "out";

interface CashEntry {
  id: string;
  amount: number;
  type: CashEntryType;
  note: string;
  createdAt: string;
  status: "queued" | "synced";
}

interface WhatsappInquiry {
  id: string;
  hour: number;
  responseMins: number;
  converted: boolean;
  createdAt: string;
}

interface SmsItem {
  id: string;
  message: string;
  createdAt: string;
  status: "queued" | "sent";
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const AFRICA_REALITY_STORAGE_KEY = "bia.africa-reality-layer";

const memoryRecords: MemoryRecord[] = [
  {
    id: "m1",
    date: "2026-03-11",
    category: "decision",
    title: "Price adjustment on coffee bundles",
    note: "Raised price slightly to absorb supplier increase; margin stabilized after one week.",
  },
  {
    id: "m2",
    date: "2026-04-06",
    category: "operations",
    title: "Reorder timing improved",
    note: "Moved reorders to Thursday morning and reduced weekend stock-outs.",
  },
  {
    id: "m3",
    date: "2026-05-19",
    category: "stress",
    title: "High stress cash week",
    note: "Reduced low-turnover inventory and recovered cash flow in 11 days.",
  },
  {
    id: "m4",
    date: "2026-06-03",
    category: "cashflow",
    title: "Transport leakage control",
    note: "Bundled supplier trips and cut transport spend trend by week three.",
  },
  {
    id: "m5",
    date: "2026-06-21",
    category: "decision",
    title: "Weekend focus shift",
    note: "Prioritized top bundles on Saturdays; repeat buyers increased.",
  },
];

const Dashboard = () => {
  const { features } = useSubscription();
  const { metrics, analyticsData, salesData } = useBusinessData();

  const cashIn = metrics.todayCashIn;
  const cashOut = metrics.todayCashOut;
  const cashOutRatio = cashIn === 0 ? 1 : cashOut / cashIn;
  const profitMargin = metrics.totalRevenue === 0 ? 0 : metrics.totalProfit / metrics.totalRevenue;
  const growthScore = clamp(metrics.growthPercentage * 1.5, 0, 26);
  const conversionScore = clamp(metrics.conversionRate * 2.4, 0, 22);
  const orderScore = clamp(metrics.totalOrders / 110, 0, 20);
  const cashScore = clamp((1 - cashOutRatio) * 24, 0, 18);
  const marginScore = clamp((profitMargin - 0.12) * 45, 0, 14);
  const mood = Math.round(clamp(8 + growthScore + conversionScore + orderScore + cashScore + marginScore, 0, 100));
  const stress = mood < 48 || cashOutRatio >= 0.9
    ? "High"
    : mood >= 76 && cashOutRatio <= 0.78
      ? "Low"
      : "Medium";
  const focus = stress === "High"
    ? "Ops"
    : metrics.growthPercentage >= 14 && metrics.conversionRate >= 5.5
      ? "Sales"
    : cashOutRatio >= 0.84
        ? "Ops"
        : mood >= 82
          ? "Thinking"
          : "Rest";
  const [dailySale, setDailySale] = useState("");
  const [savedDailySale, setSavedDailySale] = useState<string | null>(null);

  const [replayPoint, setReplayPoint] = useState(55);
  const [priceChange, setPriceChange] = useState(5);
  const [expenseCut, setExpenseCut] = useState(7);
  const [whatsappPush, setWhatsappPush] = useState(6);

  const [decisionTag, setDecisionTag] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionNotes, setDecisionNotes] = useState<string[]>([]);

  const [smallWin, setSmallWin] = useState("");
  const [energyDrain, setEnergyDrain] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>("weekly");
  const [memoryVaultOpen, setMemoryVaultOpen] = useState(false);
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | "all">("all");
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);
  const [weakNetworkMode, setWeakNetworkMode] = useState(false);
  const [cashEntryType, setCashEntryType] = useState<CashEntryType>("in");
  const [cashEntryAmount, setCashEntryAmount] = useState("");
  const [cashEntryNote, setCashEntryNote] = useState("");
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [sharedPhoneEnabled, setSharedPhoneEnabled] = useState(true);
  const [activeRole, setActiveRole] = useState<"Owner" | "Staff" | "Accountant">("Owner");
  const [rolePin, setRolePin] = useState("1234");
  const [pinInput, setPinInput] = useState("");
  const [roleLocked, setRoleLocked] = useState(true);
  const [whatsappHour, setWhatsappHour] = useState("18");
  const [whatsappResponseMins, setWhatsappResponseMins] = useState("25");
  const [whatsappConverted, setWhatsappConverted] = useState(true);
  const [whatsappInquiries, setWhatsappInquiries] = useState<WhatsappInquiry[]>([
    { id: "w1", hour: 9, responseMins: 18, converted: true, createdAt: "2026-02-23T09:10:00.000Z" },
    { id: "w2", hour: 12, responseMins: 45, converted: false, createdAt: "2026-02-23T12:42:00.000Z" },
    { id: "w3", hour: 18, responseMins: 14, converted: true, createdAt: "2026-02-23T18:12:00.000Z" },
    { id: "w4", hour: 18, responseMins: 37, converted: false, createdAt: "2026-02-23T18:36:00.000Z" },
    { id: "w5", hour: 19, responseMins: 22, converted: true, createdAt: "2026-02-23T19:08:00.000Z" },
  ]);
  const [smsHistory, setSmsHistory] = useState<SmsItem[]>([]);

  const moodText = useMemo(() => {
    if (mood >= 70) return "Stable and growing";
    if (mood >= 45) return "Stable but tired";
    return "At risk and overloaded";
  }, [mood]);

  const moodSignal = useMemo(() => {
    if (mood >= 70) return "text-primary bg-primary/10";
    if (mood >= 45) return "text-amber-700 bg-amber-100";
    return "text-destructive bg-destructive/10";
  }, [mood]);

  const insightStyle = useMemo(() => {
    if (mood >= 70) {
      return {
        wrapper: "border-primary/30 bg-primary/10",
        text: "text-primary",
      };
    }
    if (mood >= 45) {
      return {
        wrapper: "border-amber-300/60 bg-amber-100/70",
        text: "text-amber-800",
      };
    }
    return {
      wrapper: "border-destructive/30 bg-destructive/10",
      text: "text-destructive",
    };
  }, [mood]);

  const focusAction = useMemo(() => {
    if (focus === "Sales") {
      return stress === "High"
        ? "Call only top repeat customers and push one fast-moving offer."
        : "Lean into your best-selling item and protect weekend stock.";
    }
    if (focus === "Ops") {
      return stress === "High"
        ? "Fix one bottleneck only: stock timing, supplier follow-up, or delivery delays."
        : "Tighten stock timing and reduce transport leakages by batching trips.";
    }
    if (focus === "Rest") {
      return stress === "High"
        ? "Protect your energy first. Delegate one task and shorten decision loops today."
        : "Choose recovery windows so tomorrow's decisions stay clear and steady.";
    }
    return stress === "High"
      ? "Use a 20-minute thinking block: one problem, one decision, one next step."
      : "Review patterns quietly and write one decision before day end.";
  }, [focus, stress]);

  const calmInsight = useMemo(() => {
    if (mood >= 70 && stress === "Low") {
      return `You're in a strong zone. Focus on ${focus.toLowerCase()} while momentum is healthy. ${focusAction}`;
    }
    if (mood < 45 && stress === "High") {
      return `Today is a protection day, not a perfection day. Keep ${focus.toLowerCase()} simple and cash-aware. ${focusAction}`;
    }
    if (stress === "High") {
      return `Pressure is elevated. Reduce decision load and keep ${focus.toLowerCase()} to one clear win. ${focusAction}`;
    }
    if (stress === "Low") {
      return `Your system is calmer today. Use the space to improve ${focus.toLowerCase()} deliberately. ${focusAction}`;
    }
    return `You are in a steady-but-tired zone. Keep ${focus.toLowerCase()} focused and avoid overcommitting. ${focusAction}`;
  }, [focus, focusAction, mood, stress]);

  const moodDrivers = useMemo(() => {
    return [
      `Growth ${metrics.growthPercentage}%`,
      `Conversion ${metrics.conversionRate}%`,
      `Cash-out ratio ${Math.round(cashOutRatio * 100)}%`,
    ];
  }, [cashOutRatio, metrics.conversionRate, metrics.growthPercentage]);

  useEffect(() => {
    const raw = localStorage.getItem(AFRICA_REALITY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        weakNetworkMode?: boolean;
        cashEntries?: CashEntry[];
        sharedPhoneEnabled?: boolean;
        activeRole?: "Owner" | "Staff" | "Accountant";
        rolePin?: string;
        roleLocked?: boolean;
        whatsappInquiries?: WhatsappInquiry[];
        smsHistory?: SmsItem[];
      };
      if (typeof parsed.weakNetworkMode === "boolean") setWeakNetworkMode(parsed.weakNetworkMode);
      if (Array.isArray(parsed.cashEntries)) setCashEntries(parsed.cashEntries);
      if (typeof parsed.sharedPhoneEnabled === "boolean") setSharedPhoneEnabled(parsed.sharedPhoneEnabled);
      if (parsed.activeRole) setActiveRole(parsed.activeRole);
      if (parsed.rolePin) setRolePin(parsed.rolePin);
      if (typeof parsed.roleLocked === "boolean") setRoleLocked(parsed.roleLocked);
      if (Array.isArray(parsed.whatsappInquiries) && parsed.whatsappInquiries.length > 0) setWhatsappInquiries(parsed.whatsappInquiries);
      if (Array.isArray(parsed.smsHistory)) setSmsHistory(parsed.smsHistory);
    } catch {
      // Ignore malformed local storage data.
    }
  }, []);

  useEffect(() => {
    const payload = {
      weakNetworkMode,
      cashEntries,
      sharedPhoneEnabled,
      activeRole,
      rolePin,
      roleLocked,
      whatsappInquiries,
      smsHistory,
    };
    localStorage.setItem(AFRICA_REALITY_STORAGE_KEY, JSON.stringify(payload));
  }, [activeRole, cashEntries, roleLocked, rolePin, sharedPhoneEnabled, smsHistory, weakNetworkMode, whatsappInquiries]);

  const cashTotals = useMemo(() => {
    return cashEntries.reduce(
      (acc, entry) => {
        if (entry.type === "in") acc.in += entry.amount;
        if (entry.type === "out") acc.out += entry.amount;
        if (entry.status === "queued") acc.queued += 1;
        return acc;
      },
      { in: 0, out: 0, queued: 0 },
    );
  }, [cashEntries]);

  const whatsappIntelligence = useMemo(() => {
    if (whatsappInquiries.length === 0) {
      return {
        peakHour: null as number | null,
        conversionRate: 0,
        missedOpportunities: 0,
      };
    }
    const hourlyCounts = whatsappInquiries.reduce<Record<number, number>>((acc, item) => {
      acc[item.hour] = (acc[item.hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Number(Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0][0]);
    const convertedCount = whatsappInquiries.filter((item) => item.converted).length;
    const missedOpportunities = whatsappInquiries.filter((item) => !item.converted || item.responseMins > 30).length;
    return {
      peakHour,
      conversionRate: Math.round((convertedCount / whatsappInquiries.length) * 100),
      missedOpportunities,
    };
  }, [whatsappInquiries]);

  const smsPreview = useMemo(() => {
    const peakWindow = whatsappIntelligence.peakHour === null
      ? "no clear peak hour yet"
      : `${String(whatsappIntelligence.peakHour).padStart(2, "0")}:00-${String(whatsappIntelligence.peakHour).padStart(2, "0")}:59`;
    return `Biz Insights: Mood ${mood}/100 (${moodText}). Cash in ${formatKES(cashIn)}, cash out ${formatKES(cashOut)}. WhatsApp peak ${peakWindow}, missed cues ${whatsappIntelligence.missedOpportunities}. Focus: ${focus}.`;
  }, [cashIn, cashOut, focus, mood, moodText, whatsappIntelligence]);

  const simulatedRevenue = Math.round(610000 * (1 + priceChange * 0.004 + whatsappPush * 0.003));
  const simulatedRisk = Math.max(8, 42 - expenseCut - Math.round(priceChange * 0.8));

  const saveDailyPrompt = () => {
    if (!dailySale.trim()) return;
    setSavedDailySale(dailySale.trim());
    setDailySale("");
  };

  const saveDecisionTag = () => {
    if (!decisionTag.trim()) return;
    const note = decisionReason.trim()
      ? `${decisionTag.trim()} - ${decisionReason.trim()}`
      : decisionTag.trim();
    setDecisionNotes((prev) => [note, ...prev].slice(0, 4));
    setDecisionTag("");
    setDecisionReason("");
  };

  const saveCashEntry = () => {
    const amount = Number(cashEntryAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const entry: CashEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount,
      type: cashEntryType,
      note: cashEntryNote.trim() || "Manual entry",
      createdAt: new Date().toISOString(),
      status: weakNetworkMode ? "queued" : "synced",
    };
    setCashEntries((prev) => [entry, ...prev].slice(0, 20));
    setCashEntryAmount("");
    setCashEntryNote("");
  };

  const flushQueuedCashEntries = () => {
    if (weakNetworkMode) return;
    setCashEntries((prev) => prev.map((entry) => (entry.status === "queued" ? { ...entry, status: "synced" } : entry)));
  };

  const savePin = () => {
    if (pinInput.trim().length < 4) return;
    setRolePin(pinInput.trim());
    setPinInput("");
    setRoleLocked(true);
  };

  const unlockRoleSwitch = () => {
    if (pinInput.trim() !== rolePin) return;
    setRoleLocked(false);
    setPinInput("");
  };

  const logWhatsappInquiry = () => {
    const hour = Number(whatsappHour);
    const responseMins = Number(whatsappResponseMins);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return;
    if (!Number.isFinite(responseMins) || responseMins < 0) return;
    const inquiry: WhatsappInquiry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      hour,
      responseMins,
      converted: whatsappConverted,
      createdAt: new Date().toISOString(),
    };
    setWhatsappInquiries((prev) => [inquiry, ...prev].slice(0, 60));
  };

  const sendSmsSummary = () => {
    const item: SmsItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: smsPreview,
      createdAt: new Date().toISOString(),
      status: weakNetworkMode ? "queued" : "sent",
    };
    setSmsHistory((prev) => [item, ...prev].slice(0, 20));
  };

  const resendQueuedSms = () => {
    if (weakNetworkMode) return;
    setSmsHistory((prev) => prev.map((sms) => (sms.status === "queued" ? { ...sms, status: "sent" } : sms)));
  };

  const filteredMemories = useMemo(() => {
    const query = memorySearch.toLowerCase().trim();
    return memoryRecords.filter((memory) => {
      const matchesFilter = memoryFilter === "all" || memory.category === memoryFilter;
      const matchesQuery = query.length === 0
        || memory.title.toLowerCase().includes(query)
        || memory.note.toLowerCase().includes(query)
        || memory.date.includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [memoryFilter, memorySearch]);

  return (
    <DashboardLayout
      title="How Is Your Business Today?"
      subtitle="A living business companion built for calm decisions in African realities"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatKES(metrics.totalRevenue)}
            change={metrics.growthPercentage}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title="Total Profit"
            value={formatKES(metrics.totalProfit)}
            change={12.3}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title="Total Orders"
            value={metrics.totalOrders}
            change={8.7}
            icon={<ShoppingCart className="w-5 h-5" />}
          />
          <KPICard
            title="Conversion Rate"
            value={metrics.conversionRate}
            suffix="%"
            change={2.1}
            icon={<Activity className="w-5 h-5" />}
          />
        </section>

        {features.business_mood && (
          <section className="surface-card-strong p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Emotional Dashboard</p>
                <h2 className="text-lg font-semibold text-foreground">Your business feels: {moodText}</h2>
                <p className="text-xs text-muted-foreground mt-1">Auto-updated from sales, conversion, orders, and cashflow signals.</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${moodSignal}`}>{moodText}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/80 p-4 bg-muted/40">
                <p className="text-sm text-muted-foreground mb-2">Mood</p>
                <Progress value={mood} className="h-2.5" />
                <p className="text-sm text-foreground mt-2">{mood}/100</p>
              </div>

              <div className="rounded-lg border border-border/80 p-4 bg-muted/40">
                <p className="text-sm text-muted-foreground mb-2">Stress Level</p>
                <p className="text-base font-semibold text-foreground">{stress}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {stress === "High" ? "Expense pressure is elevated." : stress === "Medium" ? "Manageable with focused execution." : "Cash and sales momentum are supportive."}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 p-4 bg-muted/40">
                <p className="text-sm text-muted-foreground mb-2">Today's Focus</p>
                <p className="text-base font-semibold text-foreground">{focus}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Suggested automatically from current business signals.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {moodDrivers.map((driver) => (
                <span key={driver} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {driver}
                </span>
              ))}
            </div>

            <div className={`rounded-lg border px-4 py-3 text-sm ${insightStyle.wrapper}`}>
              <p className={`font-medium mb-1 ${insightStyle.text}`}>Insight</p>
              <p className={insightStyle.text}>{calmInsight}</p>
            </div>
          </section>
        )}

        <section className="grid xl:grid-cols-2 gap-6">
          <div className="surface-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Business Pulse</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-xs text-muted-foreground">Cash In</p>
                <p className="text-lg font-semibold text-foreground">{formatKES(cashIn)}</p>
                <p className="text-xs text-primary mt-1">+9% vs last week</p>
              </div>
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-xs text-muted-foreground">Cash Out</p>
                <p className="text-lg font-semibold text-foreground">{formatKES(cashOut)}</p>
                <p className="text-xs text-amber-700 mt-1">Transport up this week</p>
              </div>
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-xs text-muted-foreground">Sales Momentum</p>
                <p className="text-lg font-semibold text-foreground">+{metrics.growthPercentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">Growing, but uneven by day</p>
              </div>
              <div className="rounded-lg border border-border/80 p-4">
                <p className="text-xs text-muted-foreground">Customer Activity</p>
                <p className="text-lg font-semibold text-foreground">{metrics.totalOrders.toLocaleString()} orders</p>
                <p className="text-xs text-muted-foreground mt-1">Repeat buyers are improving</p>
              </div>
            </div>
          </div>

          <div className="surface-card p-6 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Trend Stories</h3>
            <div className="rounded-lg border border-border/80 p-4 text-sm">
              Sales dipped on Tuesdays, likely due to stock timing.
            </div>
            <div className="rounded-lg border border-border/80 p-4 text-sm">
              Saturday bundles continue to drive the best margins.
            </div>
            <div className="rounded-lg border border-border/80 p-4 text-sm">
              Inventory pressure is mostly from two fast-moving items.
            </div>
          </div>
        </section>

        <section className="surface-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Analytics Explorer</h3>
              <p className="text-sm text-muted-foreground">Select weekly, monthly, or yearly analytics.</p>
            </div>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as AnalyticsPeriod[]).map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={analyticsPeriod === period ? "default" : "outline"}
                  className="capitalize"
                  onClick={() => setAnalyticsPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <RevenueExpensesChart period={analyticsPeriod} dataOverride={analyticsData[analyticsPeriod]} />
            <SalesTrendChart period={analyticsPeriod} dataOverride={salesData[analyticsPeriod]} />
          </div>

          <div className="w-full">
            <ProductSalesChart />
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-6">
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Decision Replay</h3>
            </div>
            <p className="text-sm text-muted-foreground">What changed when you made key moves?</p>
            <input
              type="range"
              min={0}
              max={100}
              value={replayPoint}
              onChange={(e) => setReplayPoint(Number(e.target.value))}
              className="w-full"
            />
            <div className="rounded-lg border border-border/80 p-4 text-sm space-y-2">
              <p>When you raised prices in March, profit improved but customer count dropped 12%.</p>
              <p className="text-muted-foreground">Confidence range: medium. Context: higher supplier costs + low stock weeks.</p>
            </div>

            <div className="space-y-2 pt-1">
              <Input
                placeholder="Manual decision tag (example: changed supplier terms)"
                value={decisionTag}
                onChange={(e) => setDecisionTag(e.target.value)}
              />
              <Textarea
                className="min-h-20"
                placeholder="Why this decision was made"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
              />
              <Button onClick={saveDecisionTag} size="sm">Save to memory</Button>
              {decisionNotes.length > 0 && (
                <div className="space-y-2">
                  {decisionNotes.map((item) => (
                    <div key={item} className="rounded-md bg-muted/50 px-3 py-2 text-sm">{item}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Forecast Mode</h3>
            </div>
            <p className="text-sm text-muted-foreground">Explore future paths without fake certainty.</p>

            <div className="space-y-3">
              <label className="text-sm text-foreground">Increase prices: {priceChange}%</label>
              <input type="range" min={0} max={15} value={priceChange} onChange={(e) => setPriceChange(Number(e.target.value))} className="w-full" />

              <label className="text-sm text-foreground">Reduce expenses: {expenseCut}%</label>
              <input type="range" min={0} max={20} value={expenseCut} onChange={(e) => setExpenseCut(Number(e.target.value))} className="w-full" />

              <label className="text-sm text-foreground">Add WhatsApp marketing effort: {whatsappPush}/10</label>
              <input type="range" min={0} max={10} value={whatsappPush} onChange={(e) => setWhatsappPush(Number(e.target.value))} className="w-full" />
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
              <p>Projected monthly revenue range: {formatKES(Math.round(simulatedRevenue * 0.92))} - {formatKES(Math.round(simulatedRevenue * 1.08))}</p>
              <p>
                Risk signal: {simulatedRisk <= 18 ? "✅" : "⚠️"} {simulatedRisk <= 18 ? "manageable" : "watch closely"}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Africa-First Reality Layer</h3>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3">
            <p className="text-sm text-foreground">Network mode</p>
            <Button
              size="sm"
              variant={weakNetworkMode ? "destructive" : "outline"}
              onClick={() => setWeakNetworkMode((prev) => !prev)}
            >
              {weakNetworkMode ? "Weak network ON" : "Weak network OFF"}
            </Button>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/80 p-4 space-y-3">
              <Wallet className="w-4 h-4 text-primary mb-2" />
              <p className="text-sm font-medium">Cash + offline support</p>
              <p className="text-xs text-muted-foreground">Fast manual entries. Low-bandwidth friendly.</p>
              <div className="flex gap-2">
                <Button size="sm" variant={cashEntryType === "in" ? "default" : "outline"} onClick={() => setCashEntryType("in")}>Cash in</Button>
                <Button size="sm" variant={cashEntryType === "out" ? "default" : "outline"} onClick={() => setCashEntryType("out")}>Cash out</Button>
              </div>
              <Input
                inputMode="decimal"
                placeholder="Amount"
                value={cashEntryAmount}
                onChange={(e) => setCashEntryAmount(e.target.value)}
              />
              <Input
                placeholder="Note (optional)"
                value={cashEntryNote}
                onChange={(e) => setCashEntryNote(e.target.value)}
              />
              <Button size="sm" className="w-full" onClick={saveCashEntry}>Save entry</Button>
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <p>Manual in: {formatKES(cashTotals.in)}</p>
                <p>Manual out: {formatKES(cashTotals.out)}</p>
                <p>Queued: {cashTotals.queued}</p>
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={flushQueuedCashEntries} disabled={weakNetworkMode || cashTotals.queued === 0}>
                Sync queued entries
              </Button>
            </div>
            <div className="rounded-lg border border-border/80 p-4 space-y-3">
              <CheckCircle2 className="w-4 h-4 text-primary mb-2" />
              <p className="text-sm font-medium">Shared phone mode</p>
              <p className="text-xs text-muted-foreground">Role privacy bubbles with PIN access.</p>
              <Button
                size="sm"
                variant={sharedPhoneEnabled ? "default" : "outline"}
                className="w-full"
                onClick={() => setSharedPhoneEnabled((prev) => !prev)}
              >
                {sharedPhoneEnabled ? "Shared mode enabled" : "Enable shared mode"}
              </Button>
              {sharedPhoneEnabled && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {(["Owner", "Staff", "Accountant"] as const).map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={activeRole === role ? "default" : "outline"}
                        onClick={() => setActiveRole(role)}
                        disabled={roleLocked}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="password"
                    placeholder={roleLocked ? "Enter PIN to unlock" : "Enter new PIN (min 4 chars)"}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={roleLocked ? unlockRoleSwitch : savePin}>
                      {roleLocked ? "Unlock" : "Update PIN"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setRoleLocked(true)}>
                      Lock now
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    <p>Active role: {roleLocked ? "Hidden" : activeRole}</p>
                    <p>{roleLocked ? "Role switch locked by PIN." : "Role switch unlocked."}</p>
                  </div>
                </>
              )}
            </div>
            <div className="rounded-lg border border-border/80 p-4 space-y-3">
              <MessageSquareText className="w-4 h-4 text-primary mb-2" />
              <p className="text-sm font-medium">WhatsApp intelligence</p>
              <p className="text-xs text-muted-foreground">Peak inquiry times and missed-opportunity cues.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="Hour (0-23)"
                  value={whatsappHour}
                  onChange={(e) => setWhatsappHour(e.target.value)}
                />
                <Input
                  inputMode="numeric"
                  placeholder="Reply mins"
                  value={whatsappResponseMins}
                  onChange={(e) => setWhatsappResponseMins(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant={whatsappConverted ? "default" : "outline"}
                className="w-full"
                onClick={() => setWhatsappConverted((prev) => !prev)}
              >
                {whatsappConverted ? "Converted to sale" : "Missed conversion"}
              </Button>
              <Button size="sm" className="w-full" onClick={logWhatsappInquiry}>Log inquiry</Button>
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <p>
                  Peak hour: {whatsappIntelligence.peakHour === null
                    ? "No data"
                    : `${String(whatsappIntelligence.peakHour).padStart(2, "0")}:00`}
                </p>
                <p>Conversion: {whatsappIntelligence.conversionRate}%</p>
                <p>Missed cues: {whatsappIntelligence.missedOpportunities}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/80 p-4 space-y-3">
              <BellRing className="w-4 h-4 text-primary mb-2" />
              <p className="text-sm font-medium">SMS summaries</p>
              <p className="text-xs text-muted-foreground">Mood + cash snapshot sent when internet is weak.</p>
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                {smsPreview}
              </div>
              <Button size="sm" className="w-full" onClick={sendSmsSummary}>
                {weakNetworkMode ? "Queue summary SMS" : "Send summary SMS"}
              </Button>
              <Button size="sm" variant="outline" className="w-full" onClick={resendQueuedSms} disabled={weakNetworkMode || !smsHistory.some((item) => item.status === "queued")}>
                Send queued SMS
              </Button>
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <p>Sent: {smsHistory.filter((item) => item.status === "sent").length}</p>
                <p>Queued: {smsHistory.filter((item) => item.status === "queued").length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-6">
          <div className="surface-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Habit & Love System</h3>
            <div className="space-y-2">
              <Input
                placeholder="One small win you noticed today"
                value={smallWin}
                onChange={(e) => setSmallWin(e.target.value)}
              />
              <Input
                placeholder="What drained your energy most today"
                value={energyDrain}
                onChange={(e) => setEnergyDrain(e.target.value)}
              />
              {features.daily_sales_prompt && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="What did you sell today?"
                    value={dailySale}
                    onChange={(e) => setDailySale(e.target.value)}
                  />
                  <Button onClick={saveDailyPrompt}>Save</Button>
                </div>
              )}
              {savedDailySale && <p className="text-xs text-primary">Saved: {savedDailySale}</p>}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Milestones</p>
              {milestones.map((m) => (
                <div key={m} className="rounded-md bg-muted/50 px-3 py-2 text-sm">{m} 😌</div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Business Story Feed</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{weeklyStory}</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              Last time you felt this stress, reducing low-turnover inventory improved cash flow in 11 days.
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-6">
          <div className="surface-card p-6 space-y-3">
            <h3 className="text-base font-semibold text-foreground">Business Twin</h3>
            <p className="text-sm text-muted-foreground">A living model of your habits, decisions, and risks.</p>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Survival vs Growth balance</span>
                <span>63/100 Growth leaning</span>
              </div>
              <Progress value={63} className="h-2.5" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMemoryVaultOpen(true)}
            className="surface-card p-6 space-y-3 text-left hover:bg-muted/40 transition-colors"
          >
            <h3 className="text-base font-semibold text-foreground">Memory Vault</h3>
            <p className="text-sm text-muted-foreground">Why decisions were made, what you feared, what worked.</p>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">Open full vault with search and filters.</div>
          </button>
        </section>

        <section className="surface-card p-5 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-sm text-foreground">
              Biz Insights Africa is operating as your Founder Intelligence System: calm guidance, contextual memory, and decision support without noise.
            </p>
          </div>
        </section>
      </div>

      <Dialog open={memoryVaultOpen} onOpenChange={setMemoryVaultOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Memory Vault</DialogTitle>
            <DialogDescription>
              Your business memory archive with searchable and filterable records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Search memories by date, title, or notes"
                value={memorySearch}
                onChange={(e) => setMemorySearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {(["all", "decision", "stress", "cashflow", "operations"] as const).map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={memoryFilter === item ? "default" : "outline"}
                    className="capitalize"
                    onClick={() => setMemoryFilter(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            {filteredMemories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                No memories found for this search/filter combination.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMemories.map((memory) => (
                  <button
                    key={memory.id}
                    type="button"
                    onClick={() => setSelectedMemory(memory)}
                    className="w-full text-left rounded-lg border border-border/70 p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-foreground">{memory.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">{memory.category}</span>
                        <span className="text-xs text-muted-foreground">{memory.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{memory.note}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMemory} onOpenChange={(open) => !open && setSelectedMemory(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMemory && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMemory.title}</DialogTitle>
                <DialogDescription>
                  {selectedMemory.category} • {selectedMemory.date}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="text-sm text-foreground">{selectedMemory.note}</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Why this memory matters</p>
                  <p className="text-sm text-foreground">
                    This memory helps your system recall what worked under similar pressure so you can make faster, calmer decisions.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;
