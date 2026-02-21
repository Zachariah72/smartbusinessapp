import { Link } from "react-router-dom";
import { BarChart3, ArrowRight, CheckCircle, TrendingUp, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-bg.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">BiasharaIQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
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
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <TrendingUp className="w-4 h-4" />
              Built for African SMEs
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Know Your Numbers.{" "}
              <span className="text-gradient">Grow Your Business.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Simple, affordable analytics for small businesses in Kenya and across Africa. 
              Upload your data, get instant insights, and make smarter decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/dashboard">
                <Button size="lg" className="text-base px-8 gap-2">
                  Try Dashboard Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="text-base px-8">
                  View Pricing
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-primary" /> No credit card</span>
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /> M-Pesa ready</span>
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
              Everything you need to understand your business
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No technical skills needed. Just upload your data and let BiasharaIQ do the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: "📊",
                title: "Visual Dashboards",
                description: "See your sales, revenue, and expenses in beautiful charts updated in real-time.",
              },
              {
                icon: "📁",
                title: "Easy Data Upload",
                description: "Upload CSV or Excel files from your POS system, M-Pesa statements, or spreadsheets.",
              },
              {
                icon: "🤖",
                title: "Smart Insights",
                description: "Get AI-powered tips like 'Your Saturday sales are 40% higher — consider extended hours.'",
              },
              {
                icon: "📱",
                title: "Mobile First",
                description: "Check your business performance anywhere, anytime, even on slow connections.",
              },
              {
                icon: "💳",
                title: "M-Pesa Payments",
                description: "Subscribe and pay using M-Pesa — the payment method you already know and trust.",
              },
              {
                icon: "📄",
                title: "Export Reports",
                description: "Download PDF and CSV reports to share with partners, investors, or your accountant.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-shadow duration-300"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Upgrade when you're ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "KES 0",
                period: "forever",
                features: ["Up to 100 records", "Basic charts", "1 dashboard", "CSV upload"],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Basic",
                price: "KES 1,500",
                period: "/month",
                features: ["Up to 5,000 records", "All chart types", "5 dashboards", "CSV & Excel upload", "Monthly reports", "Email support"],
                cta: "Start Free Trial",
                popular: true,
              },
              {
                name: "Pro",
                price: "KES 4,500",
                period: "/month",
                features: ["Unlimited records", "AI insights", "Unlimited dashboards", "API integrations", "PDF & CSV exports", "Priority support", "Team access"],
                cta: "Start Free Trial",
                popular: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 relative ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-glow scale-105"
                    : "bg-card shadow-card border border-border"
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
                  <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
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
              <span className="font-display font-bold text-foreground">BiasharaIQ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 BiasharaIQ. Built for African businesses. 🇰🇪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
