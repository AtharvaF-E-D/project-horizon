import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
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
import ResetPassword from "./pages/ResetPassword";
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
import SuspensionStats from "./pages/SuspensionStats";
import Invoices from "./pages/Invoices";
import Proposals from "./pages/Proposals";
import SocialMedia from "./pages/SocialMedia";
import EcommerceInsights from "./pages/EcommerceInsights";
import HelpSupport from "./pages/HelpSupport";
import VoiceNotes from "./pages/VoiceNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/leads/new" element={<ProtectedRoute permission="leads"><AddLead /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute permission="leads"><LeadDetails /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute permission="leads"><Leads /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute permission="pipeline"><Pipeline /></ProtectedRoute>} />
          <Route path="/deals/new" element={<ProtectedRoute permission="deals"><DealDetails /></ProtectedRoute>} />
          <Route path="/deals/:id" element={<ProtectedRoute permission="deals"><DealDetails /></ProtectedRoute>} />
          <Route path="/deals" element={<ProtectedRoute permission="deals"><Deals /></ProtectedRoute>} />
          <Route path="/contacts/new" element={<ProtectedRoute permission="contacts"><ContactDetails /></ProtectedRoute>} />
          <Route path="/contacts/:id" element={<ProtectedRoute permission="contacts"><ContactDetails /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute permission="contacts"><Contacts /></ProtectedRoute>} />
          <Route path="/companies/new" element={<ProtectedRoute permission="companies"><CompanyDetails /></ProtectedRoute>} />
          <Route path="/companies/:id" element={<ProtectedRoute permission="companies"><CompanyDetails /></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute permission="companies"><Companies /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute permission="analytics"><Analytics /></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute permission="aiAssistant"><AIAssistant /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute permission="tasks"><Tasks /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute permission="tasks"><TaskDetails /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute permission="campaigns"><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<ProtectedRoute permission="campaigns"><CampaignDetails /></ProtectedRoute>} />
          <Route path="/campaigns/new" element={<ProtectedRoute permission="campaigns"><CampaignDetails /></ProtectedRoute>} />
          <Route path="/campaign-analytics" element={<ProtectedRoute permission="campaignAnalytics"><CampaignAnalytics /></ProtectedRoute>} />
          <Route path="/segments" element={<ProtectedRoute permission="segments"><Segments /></ProtectedRoute>} />
          <Route path="/sequences" element={<ProtectedRoute permission="sequences"><EmailSequences /></ProtectedRoute>} />
          <Route path="/subscribers" element={<ProtectedRoute permission="subscribers"><Subscribers /></ProtectedRoute>} />
          <Route path="/email-templates" element={<ProtectedRoute permission="emailTemplates"><EmailTemplates /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute permission="whatsapp"><WhatsApp /></ProtectedRoute>} />
          <Route path="/calls" element={<ProtectedRoute permission="calls"><Calls /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permission="reports"><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute permission="settings"><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute permission="team"><Team /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityTimeline /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute permission="auditLogs"><AuditLogs /></ProtectedRoute>} />
          <Route path="/data-import-export" element={<ProtectedRoute permission="dataImportExport"><DataImportExport /></ProtectedRoute>} />
          <Route path="/roles" element={<ProtectedRoute permission="roles"><RoleManagement /></ProtectedRoute>} />
          <Route path="/rate-limits" element={<ProtectedRoute permission="rateLimits"><RateLimitDashboard /></ProtectedRoute>} />
          <Route path="/suspended-users" element={<ProtectedRoute permission="suspendedUsers"><SuspendedUsers /></ProtectedRoute>} />
          <Route path="/suspension-stats" element={<ProtectedRoute permission="suspendedUsers"><SuspensionStats /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute permission="invoices"><Invoices /></ProtectedRoute>} />
          <Route path="/proposals" element={<ProtectedRoute permission="proposals"><Proposals /></ProtectedRoute>} />
          <Route path="/social-media" element={<ProtectedRoute permission="socialMedia"><SocialMedia /></ProtectedRoute>} />
          <Route path="/ecommerce" element={<ProtectedRoute permission="ecommerce"><EcommerceInsights /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute permission="helpSupport"><HelpSupport /></ProtectedRoute>} />
          <Route path="/voice-notes" element={<ProtectedRoute permission="voiceNotes"><VoiceNotes /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
