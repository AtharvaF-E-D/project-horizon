import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  TrendingUp,
  ListTodo,
  Mail,
  MessageCircle,
  Phone,
  BarChart3,
  FileText,
  Calendar,
  ShoppingCart,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: TrendingUp, label: "Pipeline", path: "/pipeline" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: Sparkles, label: "AI Assistant", path: "/ai" },
  { icon: Mail, label: "Campaigns", path: "/campaigns" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
  { icon: Phone, label: "Calls", path: "/calls" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: Calendar, label: "Social", path: "/social" },
  { icon: ShoppingCart, label: "E-commerce", path: "/ecommerce" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const DashboardNav = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card overflow-y-auto">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 transition-smooth",
                isActive && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
              asChild
            >
              <Link to={item.path}>
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </aside>
  );
};
