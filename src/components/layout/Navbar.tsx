import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center transition-smooth group-hover:scale-110">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SIMPLIFY
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              Pricing
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
