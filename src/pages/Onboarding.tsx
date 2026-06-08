import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Rocket } from "lucide-react";

const INDUSTRIES = ["SaaS", "Real Estate", "E-commerce", "Healthcare", "Education", "Agency", "Other"];

const Onboarding = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [biz, setBiz] = useState({ business_name: "", industry: "SaaS", website: "", timezone: "UTC" });
  const [services, setServices] = useState("");
  const [pricing, setPricing] = useState("");
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const [tone, setTone] = useState("friendly and professional");

  useEffect(() => {
    if (!user) return;
    supabase.from("business_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setBiz({
        business_name: data.business_name || "", industry: data.industry || "SaaS",
        website: data.website || "", timezone: data.timezone || "UTC",
      });
    });
  }, [user]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    if (!user) return;
    await supabase.from("business_settings").upsert({
      user_id: user.id, ...biz, onboarding_completed: true,
    }, { onConflict: "user_id" });

    const inserts = [];
    if (services) inserts.push({ user_id: user.id, category: "services", answer: services, tone });
    if (pricing) inserts.push({ user_id: user.id, category: "pricing", answer: pricing, tone });
    if (faqQ && faqA) inserts.push({ user_id: user.id, category: "faq", question: faqQ, answer: faqA, tone });
    if (inserts.length) await supabase.from("ai_training").insert(inserts);

    toast({ title: "Onboarding complete!", description: "Your AI is trained and ready." });
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Rocket className="w-7 h-7 text-primary" /> Business Onboarding</h1>
          <p className="text-muted-foreground">Step {step} of 4 — train your AI assistant.</p>
          <Progress value={(step / 4) * 100} className="mt-3" />
        </div>

        <Card>
          <CardHeader><CardTitle>
            {step === 1 && "About your business"}
            {step === 2 && "Services offered"}
            {step === 3 && "Pricing & FAQ"}
            {step === 4 && "Tone & voice"}
          </CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div><Label>Business Name</Label><Input value={biz.business_name} onChange={(e) => setBiz({ ...biz, business_name: e.target.value })} /></div>
                <div>
                  <Label>Industry</Label>
                  <Select value={biz.industry} onValueChange={(v) => setBiz({ ...biz, industry: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Website</Label><Input value={biz.website} onChange={(e) => setBiz({ ...biz, website: e.target.value })} placeholder="https://" /></div>
                <div><Label>Timezone</Label><Input value={biz.timezone} onChange={(e) => setBiz({ ...biz, timezone: e.target.value })} placeholder="UTC" /></div>
              </>
            )}
            {step === 2 && (
              <div>
                <Label>What services do you offer?</Label>
                <Textarea rows={6} value={services} onChange={(e) => setServices(e.target.value)} placeholder="List your services, packages, deliverables..." />
              </div>
            )}
            {step === 3 && (
              <>
                <div><Label>Pricing summary</Label><Textarea rows={4} value={pricing} onChange={(e) => setPricing(e.target.value)} placeholder="Starting at $X / month..." /></div>
                <div><Label>Sample FAQ Question</Label><Input value={faqQ} onChange={(e) => setFaqQ(e.target.value)} placeholder="Do you offer refunds?" /></div>
                <div><Label>FAQ Answer</Label><Textarea rows={3} value={faqA} onChange={(e) => setFaqA(e.target.value)} /></div>
              </>
            )}
            {step === 4 && (
              <div>
                <Label>How should your AI sound?</Label>
                <Textarea rows={3} value={tone} onChange={(e) => setTone(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-2">e.g., "friendly and professional", "casual and witty", "formal and concise"</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
              {step < 4 ? <Button onClick={next}>Next</Button> : <Button onClick={finish}>Finish</Button>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Onboarding;
