import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Bot, User, Loader2, Database, MessageSquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { demoRecentTransactions, demoTopProducts, demoWeeklyData, formatKES, kpis } from "@/lib/demo-data";

type Msg = { role: "user" | "assistant"; content: string };

type AssistantRecord = {
  at: string;
  question: string;
  answer: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: string;
};

const CHAT_SESSIONS_KEY = "assistant_chat_sessions";
const ACTIVE_CHAT_KEY = "assistant_active_chat";
const MEMORY_STORAGE_KEY = "assistant_memory_records";

const suggestions = [
  "Why did my sales drop last week?",
  "Which product is underperforming right now?",
  "What should I improve this month?",
  "How can I reduce my expenses without hurting sales?",
];

const defaultGreeting: Msg = {
  role: "assistant",
  content: "Hello! I am your Biz Insights Africa assistant. Ask me anything about your business in plain language.",
};

const GREETING_REGEX = /^(hello|hi|hey|jambo|habari|good morning|good afternoon|good evening)\b/i;

const sanitizePlainText = (value: string) => {
  return value
    .replace(/```[\\s\\S]*?```/g, "")
    .replace(/^#{1,6}\\s*/gm, "")
    .replace(/^\\s*[-*+]\\s+/gm, "")
    .replace(/^\\s*>\\s?/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\\n{3,}/g, "\\n\\n")
    .trim();
};

const makeSession = (): ChatSession => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "New Chat",
  messages: [defaultGreeting],
  updatedAt: new Date().toISOString(),
});

const deriveChatTitle = (messages: Msg[]) => {
  const firstUser = messages.find((m) => m.role === "user")?.content.trim();
  if (!firstUser) return "New Chat";
  return firstUser.length > 42 ? `${firstUser.slice(0, 42)}...` : firstUser;
};

const AssistantPage = () => {
  const [chats, setChats] = useState<ChatSession[]>([makeSession()]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [records, setRecords] = useState<AssistantRecord[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedChats = localStorage.getItem(CHAT_SESSIONS_KEY);
    const storedActive = localStorage.getItem(ACTIVE_CHAT_KEY);
    const storedMemory = localStorage.getItem(MEMORY_STORAGE_KEY);

    if (storedChats) {
      try {
        const parsed = JSON.parse(storedChats) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
          setActiveChatId(storedActive && parsed.some((c) => c.id === storedActive) ? storedActive : parsed[0].id);
        }
      } catch {
        const fresh = makeSession();
        setChats([fresh]);
        setActiveChatId(fresh.id);
      }
    } else {
      const fresh = makeSession();
      setChats([fresh]);
      setActiveChatId(fresh.id);
    }

    if (storedMemory) {
      try {
        const parsed = JSON.parse(storedMemory) as AssistantRecord[];
        if (Array.isArray(parsed)) setRecords(parsed);
      } catch {
        setRecords([]);
      }
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [chats],
  );

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats],
  );

  const messages = activeChat?.messages ?? [defaultGreeting];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const businessContext = useMemo(() => {
    const weeklySales = demoWeeklyData.map((d) => ({ day: d.day, sales: d.sales, orders: d.orders }));
    const topProducts = demoTopProducts.map((p) => ({ name: p.name, sales: p.sales, revenue: p.revenue, trend: p.trend }));
    const failedMpesa = demoRecentTransactions.filter((t) => t.status === "failed" && t.method === "M-Pesa");

    return {
      businessProfile: {
        name: "Mama Fua Shop",
        region: "Kenya",
        model: "Retail SME",
      },
      kpis: {
        totalRevenue: kpis.totalRevenue,
        totalProfit: kpis.totalProfit,
        totalOrders: kpis.totalOrders,
        growthPercentage: kpis.growthPercentage,
        averageOrderValue: kpis.averageOrderValue,
      },
      weeklySales,
      topProducts,
      paymentSignals: {
        preferredMethod: "M-Pesa",
        failedTransactionsCount: failedMpesa.length,
        failedTransactionsValue: failedMpesa.reduce((acc, item) => acc + item.amount, 0),
      },
      profileSummary: `Revenue ${formatKES(kpis.totalRevenue)}, profit ${formatKES(kpis.totalProfit)}, growth ${kpis.growthPercentage}%`,
    };
  }, []);

  const updateActiveChat = (updater: (messages: Msg[]) => Msg[]) => {
    if (!activeChat?.id) return;
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChat.id) return chat;
        const nextMessages = updater(chat.messages);
        return {
          ...chat,
          messages: nextMessages,
          title: deriveChatTitle(nextMessages),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const createNewChat = () => {
    const newSession = makeSession();
    setChats((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    setInput("");
  };

  const closeActiveChat = () => {
    if (!activeChat?.id) return;

    setChats((prev) => {
      const remaining = prev.filter((chat) => chat.id !== activeChat.id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
        return remaining;
      }

      const fallback = makeSession();
      setActiveChatId(fallback.id);
      return [fallback];
    });
    setInput("");
  };

  const deleteChatById = (chatId: string) => {
    setChats((prev) => {
      const remaining = prev.filter((chat) => chat.id !== chatId);
      if (remaining.length === 0) {
        const fallback = makeSession();
        setActiveChatId(fallback.id);
        return [fallback];
      }
      if (activeChatId === chatId) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !activeChat?.id) return;

    const question = text.trim();
    const userMsg: Msg = { role: "user", content: question };
    const allMessages = [...messages, userMsg];

    updateActiveChat(() => allMessages);
    setInput("");
    setIsLoading(true);

    if (GREETING_REGEX.test(question) && question.split(" ").length <= 5) {
      const greetingReply = "Hello! I am here and ready. Ask me any specific business question and I will answer directly.";
      updateActiveChat((current) => [...current, { role: "assistant", content: greetingReply }]);
      setRecords((prev) => [
        ...prev,
        { at: new Date().toISOString(), question, answer: greetingReply },
      ].slice(-50));
      setIsLoading(false);
      return;
    }

    let assistantRaw = "";
    const upsertAssistant = (chunk: string) => {
      assistantRaw += chunk;
      const clean = sanitizePlainText(assistantRaw);

      updateActiveChat((current) => {
        const last = current[current.length - 1];
        if (last?.role === "assistant") {
          return current.map((msg, idx) => (idx === current.length - 1 ? { ...msg, content: clean } : msg));
        }
        return [...current, { role: "assistant", content: clean }];
      });
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-assistant`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages
            .filter((m) => m.role !== "assistant" || m !== allMessages[0])
            .map((m) => ({ role: m.role, content: m.content })),
          businessContext,
          assistantMemory: records.slice(-10),
          outputMode: "plain_text",
        }),
      });

      if (resp.status === 429) {
        upsertAssistant("I am getting too many requests right now. Please try again in a moment.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        upsertAssistant("AI usage limit reached. Please try again later.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = `${line}\n${textBuffer}`;
            break;
          }
        }
      }

      const finalAnswer = sanitizePlainText(assistantRaw);
      if (finalAnswer.length > 0) {
        setRecords((prev) => [
          ...prev,
          {
            at: new Date().toISOString(),
            question,
            answer: finalAnswer,
          },
        ].slice(-50));
      }
    } catch (e) {
      console.error(e);
      upsertAssistant("Sorry, I could not process your request. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <DashboardLayout title="Business Assistant" subtitle="Ask questions about your business in plain language">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 w-full min-h-[65vh] lg:h-[calc(100vh-10rem)]">
        <div className="surface-card p-3 flex flex-col max-h-[50vh] lg:max-h-none">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-medium text-foreground">Chat History</p>
            <Button size="sm" variant="outline" className="h-8 px-2" onClick={createNewChat}>
              <MessageSquarePlus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                className={`w-full rounded-lg px-3 py-2 border text-sm transition-colors ${
                  activeChatId === chat.id
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "border-border/70 hover:bg-muted/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className="w-full text-left"
                >
                  <p className="font-medium truncate">{chat.title}</p>
                </button>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{new Date(chat.updatedAt).toLocaleString()}</p>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => {
                      const ok = window.confirm(`Delete chat: "${chat.title}"?`);
                      if (ok) deleteChatById(chat.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/70 gap-3">
            <p className="text-xs text-muted-foreground">Assistant memory active. Profile, sales, and recent Q&A context are tracked.</p>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="w-3.5 h-3.5" />
                {records.length} records
              </div>
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={closeActiveChat}>
                <X className="w-3.5 h-3.5 mr-1" /> Close Chat
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[92%] sm:max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "surface-card text-foreground"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="surface-card px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            <Input
              placeholder="Ask about your business..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              disabled={isLoading}
            />
            <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssistantPage;
