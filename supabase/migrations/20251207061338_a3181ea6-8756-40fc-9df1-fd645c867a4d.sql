-- Add scheduled_at column for call scheduling
ALTER TABLE public.calls
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Add index for faster queries on scheduled calls
CREATE INDEX idx_calls_scheduled_at ON public.calls(scheduled_at) WHERE scheduled_at IS NOT NULL;