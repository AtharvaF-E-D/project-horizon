# Build Plan — Missing CRM Features

The requirement doc lists ~30 missing capabilities. Building everything in one shot is unrealistic and unsafe (would touch 50+ files, multiple migrations, external APIs). I'll group them into **6 phases** by dependency and impact, then execute them in sequence with your approval between phases.

## Full Feature List (Missing)

### A. AI Intelligence (no external setup needed — uses Lovable AI)
1. AI Lead Scoring (Hot/Warm/Cold) + score badge on lead cards
2. AI Lead Summary + Next Best Action on lead detail
3. AI Call Summary + Sentiment Analysis on call detail
4. AI Suggested Replies + Intent Detection in WhatsApp inbox
5. AI Sales Coach (analyze call notes for tone/objections/closing)
6. AI Prompt Assistant — preset prompts ("Generate follow-up", "Summarize today's calls", "Create campaign")
7. AI Campaign Generator (writes subject + body)
8. AI Inactivity / Risk detection daily job

### B. Workflow & Scheduling
9. Appointments & Scheduling module (calendar, slots, booking, reminders)
10. Visual Automation Workflow Builder (trigger → action chains)
11. Smart task auto-generation from triggers

### C. Onboarding & Admin
12. Business Onboarding wizard (industry, business setup, AI training: FAQs/services/pricing/hours/tone)
13. Admin Panel (subscription plans, usage tracking, AI usage monitoring, billing summary)
14. OTP verification on signup (optional toggle)

### D. Dashboard & UX widgets
15. AI Insight widget on Dashboard
16. Visual Lead Funnel widget (New→Contacted→Qualified→Won)
17. Team Activity widget (online agents, active calls, response time)
18. Recent Conversations widget (WhatsApp + missed calls)
19. KPI cards: Active Campaigns, Pending Follow-ups
20. Lead Profile Drawer (combined chats + calls + notes + AI in one slide-over)
21. Unified Timeline per contact (chats + calls + emails + notes)

### E. Team / Productivity
22. Live agent tracking (online/offline presence + active calls)
23. Leaderboard (calls made, conversion, response time)
24. Targets / Quotas per agent
25. Floating AI button (global) + sparkle/glow design tokens

### F. External integrations (require API keys / user setup)
26. Real WhatsApp Business API (currently simulated)
27. Google / Outlook Calendar sync
28. Google Sheets, Meta Ads, Google Ads, Razorpay, Stripe, Webhooks
29. SMS channel (Twilio Messaging)
30. Mobile Push notifications (PWA)
31. Mobile shell — bottom nav, swipe actions, voice notes

---

## Phased Execution

### **Phase 1 — AI Intelligence Layer** (high ROI, no external deps)
Build all 8 AI features (A1–A8). Adds:
- 1 edge function `ai-insights` (multi-purpose: scoring, summary, next-action, sentiment, suggestions, campaign-writer)
- DB columns: `leads.ai_score_label`, `leads.ai_summary`, `leads.ai_next_action`; `calls.sentiment`, `calls.transcript`; `whatsapp_messages.ai_intent`
- UI: badges on lead cards, AI panels on Lead/Call detail, suggested-reply chips above WhatsApp input, prompt presets in AI Assistant

### **Phase 2 — Dashboard & Profile UX** (visual polish, reuses existing data)
Build D15–D21:
- New widgets in `Dashboard.tsx` (funnel, AI insight, team activity, recent convos, extra KPIs)
- Lead Profile Drawer component + Unified Timeline tab
- Floating AI button component mounted in `App.tsx`

### **Phase 3 — Appointments + Workflow Builder**
Build B9, B10, B11:
- New tables: `appointments`, `automation_workflows`, `workflow_runs`
- Pages: `Appointments.tsx` (calendar grid + booking form), `Automations.tsx` (visual builder using react-flow)
- Edge function `workflow-executor` triggered on lead/message events

### **Phase 4 — Team Productivity**
Build E22–E25:
- New table: `agent_presence`, `agent_targets`
- Pages: `Leaderboard.tsx`, `Targets.tsx`
- Realtime presence channel for online status

### **Phase 5 — Onboarding + Admin Panel**
Build C12, C13, C14:
- New tables: `business_settings`, `ai_training`, `subscription_plans`, `usage_metrics`
- Pages: `Onboarding.tsx` (wizard), `AdminPanel.tsx`

### **Phase 6 — External integrations** (each requires user action)
F26–F31, done one at a time as you provide API keys / approve.

---

## Recommendation

I'll execute **Phase 1 now** — it's the biggest differentiator ("AI-powered" is your core positioning) and needs zero external setup. After it's working, you approve Phase 2, etc.

Estimated scope for Phase 1: 1 migration, 1 edge function (~250 lines), 6 file edits, 3 new components.
