import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneCall, Settings2, Loader2, PhoneForwarded } from "lucide-react";
import { useTwilioCaller } from "@/hooks/useTwilioCaller";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TwilioDialerProps {
  dialNumber: string;
  contactName?: string | null;
}

export function TwilioDialer({ dialNumber, contactName }: TwilioDialerProps) {
  const {
    twilioNumbers,
    selectedTwilioNumber,
    agentPhone,
    isCalling,
    isLoadingNumbers,
    setSelectedTwilioNumber,
    setAgentPhone,
    fetchTwilioNumbers,
    makeCall,
  } = useTwilioCaller();

  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchTwilioNumbers();
      setLoaded(true);
    }
  }, [loaded, fetchTwilioNumbers]);

  const isConfigured = selectedTwilioNumber && agentPhone;

  const handleMakeCall = async () => {
    if (!dialNumber) return;
    await makeCall(dialNumber);
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Twilio Click-to-Call</CardTitle>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"} className="text-xs">
            {isConfigured ? "Ready" : "Setup Required"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Call via Twilio — rings your phone, then connects to the customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Call Button */}
        <Button
          onClick={handleMakeCall}
          disabled={!dialNumber || !isConfigured || isCalling}
          className="w-full gap-2"
          variant="default"
        >
          {isCalling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              Call {contactName || dialNumber || "via Twilio"}
            </>
          )}
        </Button>

        {/* Settings */}
        <Collapsible open={showSettings || !isConfigured} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground">
              <Settings2 className="w-3 h-3" />
              {showSettings ? "Hide Settings" : "Configure Twilio"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Twilio Number */}
            <div className="space-y-1.5">
              <Label className="text-xs">Twilio Phone Number (Caller ID)</Label>
              {isLoadingNumbers ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading numbers...
                </div>
              ) : twilioNumbers.length > 0 ? (
                <Select value={selectedTwilioNumber} onValueChange={setSelectedTwilioNumber}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Twilio number" />
                  </SelectTrigger>
                  <SelectContent>
                    {twilioNumbers.map((num) => (
                      <SelectItem key={num.sid} value={num.phoneNumber}>
                        {num.friendlyName} ({num.phoneNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/50">
                  No Twilio numbers found.{" "}
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={fetchTwilioNumbers}>
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* Agent Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs">Your Phone Number (receives calls)</Label>
              <Input
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value)}
                placeholder="+1234567890"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                E.164 format. When you click Call, Twilio rings this number first.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
