
-- Phase 3: Workflows
CREATE TABLE public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_workflows TO authenticated;
GRANT ALL ON public.automation_workflows TO service_role;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workflows" ON public.automation_workflows FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_data JSONB DEFAULT '{}'::jsonb,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own runs" ON public.workflow_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service inserts runs" ON public.workflow_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Phase 4: Presence + Targets
CREATE TABLE public.agent_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_call_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_presence TO authenticated;
GRANT ALL ON public.agent_presence TO service_role;
ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated view presence" ON public.agent_presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own presence" ON public.agent_presence FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.agent_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  calls_target INTEGER NOT NULL DEFAULT 0,
  deals_target INTEGER NOT NULL DEFAULT 0,
  revenue_target NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_targets TO authenticated;
GRANT ALL ON public.agent_targets TO service_role;
ALTER TABLE public.agent_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View targets" ON public.agent_targets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers set targets" ON public.agent_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Phase 5: Onboarding + Admin
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  industry TEXT,
  website TEXT,
  business_hours JSONB DEFAULT '{}'::jsonb,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.business_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.ai_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'faq',
  question TEXT,
  answer TEXT NOT NULL,
  tone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_training TO authenticated;
GRANT ALL ON public.ai_training TO service_role;
ALTER TABLE public.ai_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own training" ON public.ai_training FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_users INTEGER,
  max_ai_calls INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed views plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage plans" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_type, metric_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_metrics TO authenticated;
GRANT ALL ON public.usage_metrics TO service_role;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own usage" ON public.usage_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own usage" ON public.usage_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own usage" ON public.usage_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.automation_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_presence_updated BEFORE UPDATE ON public.agent_presence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_targets_updated BEFORE UPDATE ON public.agent_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_biz_updated BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_aitrain_updated BEFORE UPDATE ON public.ai_training FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_presence;

-- Seed default plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_users, max_ai_calls) VALUES
  ('Free', 'Get started', 0, 0, '["1 user","100 AI calls/mo","Basic CRM"]'::jsonb, 1, 100),
  ('Pro', 'For growing teams', 49, 490, '["10 users","5000 AI calls/mo","All integrations","Workflows"]'::jsonb, 10, 5000),
  ('Enterprise', 'Custom needs', 199, 1990, '["Unlimited users","Unlimited AI","SLA","SSO"]'::jsonb, NULL, NULL);
