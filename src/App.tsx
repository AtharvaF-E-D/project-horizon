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
import AIAssistant from "./pages/AIAssistant";
import Tasks from "./pages/Tasks";
import Campaigns from "./pages/Campaigns";
import WhatsApp from "./pages/WhatsApp";
import Calls from "./pages/Calls";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import Notifications from "./pages/Notifications";
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
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
