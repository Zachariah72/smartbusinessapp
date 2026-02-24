import { Link } from "react-router-dom";
import { BarChart3, ArrowRight, CheckCircle, TrendingUp, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bg.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen app-shell-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/70">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Biz Insights Africa</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#model" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Model</a>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm">Start Free</Button>
            </Link>
          </div>
          <Link to="/dashboard" className="md:hidden">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsla(152,55%,28%,0.16),transparent_38%),radial-gradient(circle_at_85%_10%,hsla(38,85%,55%,0.2),transparent_30%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <TrendingUp className="w-4 h-4" />
              The Calm Business OS
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              How Is Your{" "}
              <span className="text-gradient">Business Today?</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              A personal + software intelligence system for African founders.
              Not a dashboard. A living business companion.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/dashboard">
                <Button size="lg" className="text-base px-8 gap-2">
                  Open Companion <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#model">
                <Button variant="outline" size="lg" className="text-base px-8">
                  View Product Model
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-primary" /> No subscriptions</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /> No feature locks</span>
              <span className="flex items-center gap-1"><Smartphone className="w-4 h-4 text-primary" /> Mobile friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Calm over complexity, guidance over graphs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Human-first, Africa-first intelligence with memory, context, and emotional realism.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: "🧠",
                title: "Emotional Dashboard",
                description: "Start with how your business feels today, then move into focused action.",
              },
              {
                icon: "📈",
                title: "Trend Stories",
                description: "Charts explain themselves in plain language, one insight at a time.",
              },
              {
                icon: "🧭",
                title: "Decision Intelligence",
                description: "Replay what changed and simulate future paths with honest ranges.",
              },
              {
                icon: "📱",
                title: "Offline Reality Ready",
                description: "Built for low bandwidth, shared devices, and WhatsApp-first operations.",
              },
              {
                icon: "🗃️",
                title: "Memory Vault",
                description: "Remembers why decisions were made so stress never resets your learning.",
              },
              {
                icon: "🤝",
                title: "Founder Companion",
                description: "Feels like a trusted advisor, diary, and mirror for growth.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="surface-card p-6 hover:-translate-y-1 hover:shadow-elevated transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model */}
      <section id="model" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Product Model
            </h2>
            <p className="text-muted-foreground text-lg">
              No subscriptions. No feature locks. No noise.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Calm Companion",
                price: "Emotional Layer",
                period: "",
                features: ["Mood check-in", "Stress-aware guidance", "Daily small wins", "Business story feed"],
                cta: "Open Dashboard",
                popular: true,
              },
              {
                name: "Decision Engine",
                price: "Intelligence Layer",
                period: "",
                features: ["Replay mode", "Forecast ranges", "Risk signals", "Manual decision memory"],
                cta: "Explore Decisions",
                popular: false,
              },
              {
                name: "Founder Moat",
                price: "Memory Layer",
                period: "",
                features: ["Business Twin", "Memory Vault", "Context recall", "Africa-first operational signals"],
                cta: "View Companion",
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 relative ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-glow scale-105"
                    : "surface-card-strong border border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-gradient text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.popular ? "text-primary-foreground/80" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "secondary" : "default"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">Biz Insights Africa</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Biz Insights Africa. Built for African founders. 🇰🇪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
