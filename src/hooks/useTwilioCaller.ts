import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TwilioNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
}

interface UseTwilioCallerReturn {
  twilioNumbers: TwilioNumber[];
  selectedTwilioNumber: string;
  agentPhone: string;
  isCalling: boolean;
  isLoadingNumbers: boolean;
  setSelectedTwilioNumber: (num: string) => void;
  setAgentPhone: (phone: string) => void;
  fetchTwilioNumbers: () => Promise<void>;
  makeCall: (to: string) => Promise<{ success: boolean; callSid?: string }>;
}

export function useTwilioCaller(): UseTwilioCallerReturn {
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [selectedTwilioNumber, setSelectedTwilioNumber] = useState("");
  const [agentPhone, setAgentPhone] = useState(() => {
    return localStorage.getItem("twilio_agent_phone") || "";
  });
  const [isCalling, setIsCalling] = useState(false);
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false);
  const { toast } = useToast();

  const fetchTwilioNumbers = useCallback(async () => {
    setIsLoadingNumbers(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-call", {
        body: { action: "list-numbers" },
      });

      if (error) throw error;
      setTwilioNumbers(data.numbers || []);
      if (data.numbers?.length > 0 && !selectedTwilioNumber) {
        setSelectedTwilioNumber(data.numbers[0].phoneNumber);
      }
    } catch (error) {
      console.error("Error fetching Twilio numbers:", error);
      toast({
        title: "Twilio Error",
        description: "Could not fetch phone numbers. Check your Twilio connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNumbers(false);
    }
  }, [selectedTwilioNumber, toast]);

  const makeCall = useCallback(
    async (to: string): Promise<{ success: boolean; callSid?: string }> => {
      if (!selectedTwilioNumber || !agentPhone) {
        toast({
          title: "Setup Required",
          description: "Please configure your Twilio number and agent phone first.",
          variant: "destructive",
        });
        return { success: false };
      }

      setIsCalling(true);
      try {
        // Save agent phone for next time
        localStorage.setItem("twilio_agent_phone", agentPhone);

        const { data, error } = await supabase.functions.invoke("twilio-call", {
          body: {
            action: "make-call",
            to,
            from: selectedTwilioNumber,
            agentPhone,
          },
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Call Initiated",
            description: `Twilio is calling your phone (${agentPhone}). Pick up to connect to ${to}.`,
          });
          return { success: true, callSid: data.callSid };
        } else {
          throw new Error(data.error || "Call failed");
        }
      } catch (error: any) {
        console.error("Error making Twilio call:", error);
        toast({
          title: "Call Failed",
          description: error.message || "Failed to initiate call via Twilio.",
          variant: "destructive",
        });
        return { success: false };
      } finally {
        setIsCalling(false);
      }
    },
    [selectedTwilioNumber, agentPhone, toast]
  );

  return {
    twilioNumbers,
    selectedTwilioNumber,
    agentPhone,
    isCalling,
    isLoadingNumbers,
    setSelectedTwilioNumber,
    setAgentPhone,
    fetchTwilioNumbers,
    makeCall,
  };
}
