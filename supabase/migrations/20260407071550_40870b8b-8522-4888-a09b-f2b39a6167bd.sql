
-- WhatsApp conversations table
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_company TEXT,
  contact_phone TEXT NOT NULL,
  contact_avatar TEXT,
  is_online BOOLEAN DEFAULT false,
  unread_count INTEGER DEFAULT 0,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.whatsapp_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('me', 'them')),
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.whatsapp_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.whatsapp_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
