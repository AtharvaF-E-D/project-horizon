import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  const handleAnchor = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center transition-smooth group-hover:scale-110">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SIMPLIFY
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleAnchor(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="gradient-primary text-primary-foreground hover:opacity-90 transition-smooth">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col gap-6 pt-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SIMPLIFY
                </span>
              </div>

              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleAnchor(link.href)}
                    className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-smooth"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>

              <div className="flex flex-col gap-3 mt-auto">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>Sign In</Link>
                </Button>
                <Button className="w-full gradient-primary text-primary-foreground hover:opacity-90" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>Get Started Free</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
