import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User, LogOut, Sparkles, Users, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardNav } from "./DashboardNav";

export const DashboardNavbar = () => {
  const { user, signOut } = useAuth();
  const { role, permissions } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="pt-4">
                <DashboardNav mobile onNavigate={() => setSidebarOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center transition-smooth group-hover:scale-110">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SIMPLIFY
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {role && (
                  <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
                    {role}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {permissions.settings && (
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
              {permissions.team && (
                <DropdownMenuItem asChild>
                  <Link to="/team" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Team
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
