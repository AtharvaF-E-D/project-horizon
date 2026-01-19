import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Pipeline from "./pages/Pipeline";
import LeadDetails from "./pages/LeadDetails";
import AddLead from "./pages/AddLead";
import Deals from "./pages/Deals";
import DealDetails from "./pages/DealDetails";
import Contacts from "./pages/Contacts";
import ContactDetails from "./pages/ContactDetails";
import Companies from "./pages/Companies";
import CompanyDetails from "./pages/CompanyDetails";
import Analytics from "./pages/Analytics";
import AIAssistant from "./pages/AIAssistant";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import Campaigns from "./pages/Campaigns";
import CampaignDetails from "./pages/CampaignDetails";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import Segments from "./pages/Segments";
import EmailSequences from "./pages/EmailSequences";
import Subscribers from "./pages/Subscribers";
import EmailTemplates from "./pages/EmailTemplates";
import WhatsApp from "./pages/WhatsApp";
import Calls from "./pages/Calls";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
import ActivityTimeline from "./pages/ActivityTimeline";
import AuditLogs from "./pages/AuditLogs";
import DataImportExport from "./pages/DataImportExport";
import RoleManagement from "./pages/RoleManagement";
import RateLimitDashboard from "./pages/RateLimitDashboard";
import SuspendedUsers from "./pages/SuspendedUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/leads/new" element={<AddLead />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/:id" element={<DealDetails />} />
          <Route path="/deals/new" element={<DealDetails />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetails />} />
          <Route path="/contacts/new" element={<ContactDetails />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<CompanyDetails />} />
          <Route path="/companies/new" element={<CompanyDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/campaigns/new" element={<CampaignDetails />} />
          <Route path="/campaign-analytics" element={<CampaignAnalytics />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/sequences" element={<EmailSequences />} />
          <Route path="/subscribers" element={<Subscribers />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/activity" element={<ActivityTimeline />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/data-import-export" element={<DataImportExport />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/rate-limits" element={<RateLimitDashboard />} />
          <Route path="/suspended-users" element={<SuspendedUsers />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
