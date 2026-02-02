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
  Mail,
  PieChart,
  Filter,
  Workflow,
  Shield,
  FileSpreadsheet,
  Gauge,
  UserX,
  BarChart2,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { RolePermissions } from "@/config/permissions";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  permissionKey: keyof RolePermissions;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permissionKey: "dashboard" },
  { icon: Users, label: "Leads", path: "/leads", permissionKey: "leads" },
  { icon: TrendingUp, label: "Pipeline", path: "/pipeline", permissionKey: "pipeline" },
  { icon: DollarSign, label: "Deals", path: "/deals", permissionKey: "deals" },
  { icon: UserCircle, label: "Contacts", path: "/contacts", permissionKey: "contacts" },
  { icon: Building2, label: "Companies", path: "/companies", permissionKey: "companies" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks", permissionKey: "tasks" },
  { icon: Megaphone, label: "Campaigns", path: "/campaigns", permissionKey: "campaigns" },
  { icon: PieChart, label: "Email Analytics", path: "/campaign-analytics", permissionKey: "campaignAnalytics" },
  { icon: Filter, label: "Segments", path: "/segments", permissionKey: "segments" },
  { icon: Workflow, label: "Sequences", path: "/sequences", permissionKey: "sequences" },
  { icon: Users, label: "Subscribers", path: "/subscribers", permissionKey: "subscribers" },
  { icon: Mail, label: "Templates", path: "/email-templates", permissionKey: "emailTemplates" },
  { icon: Users, label: "Team", path: "/team", permissionKey: "team" },
  { icon: Activity, label: "Audit Logs", path: "/audit-logs", permissionKey: "auditLogs" },
  { icon: FileSpreadsheet, label: "Import/Export", path: "/data-import-export", permissionKey: "dataImportExport" },
  { icon: Gauge, label: "Rate Limits", path: "/rate-limits", permissionKey: "rateLimits" },
  { icon: UserX, label: "Suspended Users", path: "/suspended-users", permissionKey: "suspendedUsers" },
  { icon: BarChart2, label: "Suspension Stats", path: "/suspension-stats", permissionKey: "suspendedUsers" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp", permissionKey: "whatsapp" },
  { icon: Phone, label: "Calls", path: "/calls", permissionKey: "calls" },
  { icon: BarChart3, label: "Reports", path: "/reports", permissionKey: "reports" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", permissionKey: "analytics" },
  { icon: Bot, label: "AI Assistant", path: "/ai-assistant", permissionKey: "aiAssistant" },
  { icon: Shield, label: "Roles", path: "/roles", permissionKey: "roles" },
];

export const DashboardNav = () => {
  const location = useLocation();
  const { permissions, loading } = useUserRole();

  const visibleItems = navItems.filter(item => permissions[item.permissionKey]);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card overflow-y-auto">
      <div className="p-4 space-y-1">
        {loading ? (
          // Show skeleton while loading permissions
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : (
          visibleItems.map((item) => {
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
          })
        )}
      </div>
    </aside>
  );
};
