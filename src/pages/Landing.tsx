import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowRight, Users, TrendingUp, Sparkles, Zap, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-dashboard.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered CRM</span>
              </div>
              
              <h1 className="font-heading text-5xl lg:text-6xl font-bold leading-tight">
                Grow Your Business{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Simplified
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                All-in-one CRM platform with AI-powered lead management, sales pipeline automation, 
                and intelligent insights to help you close more deals.
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

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-foreground">10k+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div>
                  <div className="text-3xl font-bold text-foreground">50M+</div>
                  <div className="text-sm text-muted-foreground">Leads Managed</div>
                </div>
              </div>
            </div>

            <div className="relative animate-scale-in">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full"></div>
              <img 
                src={heroImage} 
                alt="SIMPLIFY CRM Dashboard" 
                className="relative rounded-2xl shadow-hover w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-heading text-4xl font-bold">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to streamline your sales process and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Lead Management",
                description: "Capture, track, and nurture leads from multiple sources in one place",
                color: "text-primary",
              },
              {
                icon: TrendingUp,
                title: "Sales Pipeline",
                description: "Visual kanban board to track deals and move them through your pipeline",
                color: "text-secondary",
              },
              {
                icon: Sparkles,
                title: "AI Assistant",
                description: "Get intelligent suggestions and automate repetitive tasks with AI",
                color: "text-accent",
              },
              {
                icon: Zap,
                title: "Automation",
                description: "Set up workflows to automate follow-ups, emails, and tasks",
                color: "text-primary",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Enterprise-grade security with 99.9% uptime guarantee",
                color: "text-secondary",
              },
              {
                icon: Globe,
                title: "Multi-Channel",
                description: "Connect via email, WhatsApp, calls, and social media",
                color: "text-accent",
              },
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 card-hover cursor-pointer border-border bg-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={cn("w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4", feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="p-12 gradient-hero text-white text-center">
            <h2 className="font-heading text-4xl font-bold mb-4">
              Ready to Simplify Your Sales?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of businesses growing with SIMPLIFY
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 SIMPLIFY. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
