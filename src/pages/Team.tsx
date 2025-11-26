import { useState, useEffect } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  title: string;
  department: string;
  role: string;
}

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const members = profiles?.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name || "Unknown",
        email: profile.email,
        title: profile.title || "Not specified",
        department: profile.department || "Not specified",
        role: roles?.find((r) => r.user_id === profile.id)?.role || "agent",
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-500",
      admin: "bg-red-500",
      manager: "bg-blue-500",
      agent: "bg-green-500",
      viewer: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-8 ml-64">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team Management</h1>
              <p className="text-muted-foreground">Manage your team members and their roles</p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>

          <Card className="p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          <div className="grid gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.full_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{member.title}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{member.department}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Team;