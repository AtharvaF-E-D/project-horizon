import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowRight, Users, TrendingUp, Sparkles, Zap, Shield, Globe,
  Check, Star, ChevronDown, BarChart3, Mail, Phone, MessageSquare,
  Calendar, FileText, Target, Workflow, Brain, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-dashboard.jpg";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Lead Management",
    description: "Capture, track, and nurture leads from multiple sources. Score and qualify prospects automatically with AI.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Sales Pipeline",
    description: "Visual drag-and-drop kanban board to move deals through every stage of your pipeline effortlessly.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Brain,
    title: "AI Assistant",
    description: "Get intelligent suggestions, auto-summarize calls, draft emails, and automate repetitive tasks with AI.",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
  {
    icon: Workflow,
    title: "Automation",
    description: "Set up smart workflows to trigger follow-ups, send emails, assign tasks, and move deals automatically.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Real-time dashboards and reports to track revenue, team performance, and pipeline health.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Globe,
    title: "Multi-Channel",
    description: "Manage outreach via email, WhatsApp, calls, voice notes, and social media from one unified inbox.",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
  {
    icon: Lock,
    title: "Role-Based Access",
    description: "Granular permissions for Owners, Admins, Managers, Agents, and Viewers to keep data secure.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    description: "Design, schedule, and track email campaigns with open rates, click rates, and A/B testing.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: FileText,
    title: "Proposals & Invoices",
    description: "Create professional proposals, send invoices, and track payment status all inside the CRM.",
    color: "text-accent-foreground",
    bg: "bg-accent/20",
  },
];

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "VP of Sales, TechNova",
    avatar: "SM",
    rating: 5,
    quote: "SIMPLIFY transformed how our 40-person sales team operates. We closed 38% more deals in our first quarter using it. The AI assistant alone saves us 2 hours per rep every single day.",
  },
  {
    name: "James Okafor",
    role: "Founder, GrowthLabs",
    avatar: "JO",
    rating: 5,
    quote: "I've tried Salesforce, HubSpot, and Pipedrive. SIMPLIFY is the first CRM that my team actually loves using. Onboarding was done in a day, and the pipeline view is brilliant.",
  },
  {
    name: "Priya Sharma",
    role: "Sales Director, CloudBridge",
    avatar: "PS",
    rating: 5,
    quote: "The multi-channel inbox is a game-changer. WhatsApp, email, and calls in one place means nothing slips through the cracks. Our response time dropped from 6 hours to under 30 minutes.",
  },
  {
    name: "Marcus Chen",
    role: "CEO, Elevate Agency",
    avatar: "MC",
    rating: 5,
    quote: "We manage 500+ client accounts with SIMPLIFY. The automation workflows handle the routine follow-ups while my team focuses on high-value conversations. ROI was clear within weeks.",
  },
  {
    name: "Amelia Torres",
    role: "Head of Revenue, Finlo",
    avatar: "AT",
    rating: 5,
    quote: "The analytics dashboard gives our executive team real-time visibility into pipeline health. We make faster, more confident decisions. Absolutely essential for our growth.",
  },
  {
    name: "David Park",
    role: "Sales Manager, Sprout SaaS",
    avatar: "DP",
    rating: 5,
    quote: "Onboarding our new reps takes 1 day instead of 2 weeks. SIMPLIFY's role-based access and intuitive UI means everyone gets up to speed fast without drowning in complexity.",
  },
];

const plans = [
  {
    name: "Starter",
    price: { monthly: 29, annual: 23 },
    description: "Perfect for small teams getting started with CRM.",
    badge: null,
    features: [
      "Up to 3 users",
      "1,000 leads",
      "Basic pipeline management",
      "Email integration",
      "Standard reports",
      "Mobile app access",
      "Email support",
    ],
    cta: "Start Free Trial",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: { monthly: 79, annual: 63 },
    description: "For growing teams that need automation and AI.",
    badge: "Most Popular",
    features: [
      "Up to 15 users",
      "Unlimited leads",
      "Advanced pipeline & kanban",
      "AI Assistant & call summaries",
      "Email campaigns & sequences",
      "WhatsApp & multi-channel inbox",
      "Advanced analytics",
      "Proposals & invoices",
      "Priority support",
    ],
    cta: "Start Free Trial",
    variant: "default" as const,
  },
  {
    name: "Enterprise",
    price: { monthly: 199, annual: 159 },
    description: "Full power for large teams with advanced security.",
    badge: null,
    features: [
      "Unlimited users",
      "Unlimited everything",
      "Custom AI models",
      "Role-based access control",
      "Audit logs & compliance",
      "Custom integrations & API",
      "Dedicated account manager",
      "SLA & 99.9% uptime",
      "White-label option",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! All plans come with a 14-day free trial, no credit card required. You get full access to all features during the trial.",
  },
  {
    q: "Can I change my plan later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.",
  },
  {
    q: "How does the AI Assistant work?",
    a: "Our AI is built on leading language models and is trained on sales-specific data. It can draft emails, summarize calls, score leads, suggest next actions, and answer questions about your pipeline.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use enterprise-grade encryption, role-based access controls, and host on secure cloud infrastructure with daily backups and 99.9% uptime.",
  },
  {
    q: "Do you offer onboarding help?",
    a: "Pro and Enterprise plans include onboarding support. Our team will help you import data, configure workflows, and train your team.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
    ))}
  </div>
);

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl p-5 cursor-pointer transition-smooth hover:border-primary/40 hover:bg-primary/5"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-foreground">{q}</p>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-smooth", open && "rotate-180")} />
      </div>
      {open && <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{a}</p>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Landing = () => {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5 pointer-events-none" />
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered CRM · Free 14-day Trial</span>
              </div>

              <h1 className="font-heading text-5xl lg:text-6xl font-bold leading-tight">
                Close More Deals,{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Effortlessly
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                SIMPLIFY is the all-in-one CRM that brings leads, pipeline, AI automation,
                multi-channel outreach, and analytics into one beautiful workspace.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-2">
                {[
                  { value: "10k+", label: "Active Users" },
                  { value: "98%", label: "Satisfaction" },
                  { value: "50M+", label: "Leads Managed" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-8">
                    {i > 0 && <div className="w-px h-10 bg-border" />}
                    <div>
                      <div className="text-3xl font-bold text-foreground font-heading">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full" />
              <img
                src={heroImage}
                alt="SIMPLIFY CRM Dashboard"
                className="relative rounded-2xl shadow-hover w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos / Social Proof Bar ── */}
      <section className="py-10 px-4 border-y border-border bg-muted/20">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted by fast-growing teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {["TechNova", "GrowthLabs", "CloudBridge", "Elevate", "Finlo", "Sprout SaaS"].map((name) => (
              <span key={name} className="font-heading font-bold text-lg text-muted-foreground">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-4 py-1">
              Features
            </Badge>
            <h2 className="font-heading text-4xl font-bold">Everything Your Sales Team Needs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From first contact to closed deal — SIMPLIFY has every tool your team needs to win.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 card-hover border-border bg-card cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", feature.bg)}>
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5 px-4 py-1">
              Testimonials
            </Badge>
            <h2 className="font-heading text-4xl font-bold">Loved by Sales Teams Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Don't take our word for it — hear from teams that transformed their sales with SIMPLIFY.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="p-6 card-hover border-border bg-card flex flex-col gap-4">
                <StarRating count={t.rating} />
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="outline" className="border-accent/50 text-accent-foreground bg-accent/10 px-4 py-1">
              Pricing
            </Badge>
            <h2 className="font-heading text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free for 14 days. No credit card required. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1 mt-4">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-smooth",
                  billing === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-medium transition-smooth flex items-center gap-2",
                  billing === "annual" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={cn(
                  "p-8 flex flex-col relative transition-smooth",
                  plan.badge
                    ? "border-primary shadow-hover scale-105 bg-card"
                    : "border-border bg-card card-hover"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-heading text-2xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground font-heading">
                      ${plan.price[billing]}
                    </span>
                    <span className="text-muted-foreground text-sm">/user/mo</span>
                  </div>
                  {billing === "annual" && (
                    <p className="text-xs text-primary mt-1">Billed annually</p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={plan.badge ? "default" : plan.variant}
                  className={cn("w-full", plan.badge && "gradient-primary text-primary-foreground hover:opacity-90")}
                  asChild
                >
                  <Link to={plan.name === "Enterprise" ? "#" : "/auth"}>{plan.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include a 14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="font-heading text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Have questions? We've got answers.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <Card className="p-12 md:p-16 gradient-hero text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
                Ready to Simplify Your Sales?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-xl mx-auto">
                Join 10,000+ businesses growing faster with SIMPLIFY. Start your free 14-day trial today.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" className="bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-smooth" asChild>
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SIMPLIFY
                </span>
              </div>
              <p className="text-sm text-muted-foreground">The AI-powered CRM for modern sales teams.</p>
            </div>
            {[
              {
                heading: "Product",
                links: ["Features", "Pricing", "Changelog", "Roadmap"],
              },
              {
                heading: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                heading: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Security", "Cookies"],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="font-semibold text-sm mb-3">{col.heading}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © 2025 SIMPLIFY. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
