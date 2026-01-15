-- Create rate limit tracking table
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_action ON public.rate_limits (user_id, action_type, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own rate limit records
CREATE POLICY "Users can insert own rate limits"
ON public.rate_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own rate limits
CREATE POLICY "Users can update own rate limits"
ON public.rate_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_result JSONB;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current request count in window
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start >= v_window_start;
  
  -- Check if rate limit exceeded
  IF v_current_count >= p_max_requests THEN
    v_result := jsonb_build_object(
      'allowed', false,
      'current_count', v_current_count,
      'max_requests', p_max_requests,
      'retry_after_seconds', EXTRACT(EPOCH FROM (v_window_start + (p_window_minutes || ' minutes')::INTERVAL - now()))::INTEGER
    );
  ELSE
    -- Insert new rate limit record
    INSERT INTO public.rate_limits (user_id, action_type, window_start)
    VALUES (p_user_id, p_action_type, now());
    
    v_result := jsonb_build_object(
      'allowed', true,
      'current_count', v_current_count + 1,
      'max_requests', p_max_requests,
      'remaining', p_max_requests - v_current_count - 1
    );
  END IF;
  
  -- Clean up old records (older than 24 hours)
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;