import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  MessageCircle,
  Phone,
  BarChart3,
  Building2,
  UserCircle,
  DollarSign,
  Bot,
  CheckSquare,
  Megaphone,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: TrendingUp, label: "Pipeline", path: "/pipeline" },
  { icon: DollarSign, label: "Deals", path: "/deals" },
  { icon: UserCircle, label: "Contacts", path: "/contacts" },
  { icon: Building2, label: "Companies", path: "/companies" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: Megaphone, label: "Campaigns", path: "/campaigns" },
  { icon: Users, label: "Subscribers", path: "/subscribers" },
  { icon: BarChart3, label: "Templates", path: "/email-templates" },
  { icon: Activity, label: "Activity", path: "/activity" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
  { icon: Phone, label: "Calls", path: "/calls" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Bot, label: "AI Assistant", path: "/ai-assistant" },
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
