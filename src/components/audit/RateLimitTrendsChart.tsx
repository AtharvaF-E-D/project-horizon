import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Bar, BarChart } from "recharts";
import { format, parseISO, startOfDay, eachDayOfInterval, subDays, startOfHour, eachHourOfInterval } from "date-fns";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RateLimitLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface RateLimitTrendsChartProps {
  logs: RateLimitLog[];
  dateRange: string;
}

const chartConfig = {
  warnings: {
    label: "90% Warnings",
    color: "hsl(45, 100%, 65%)",
  },
  exceeded: {
    label: "Limit Exceeded",
    color: "hsl(0, 84%, 60%)",
  },
  total: {
    label: "Total Alerts",
    color: "hsl(174, 100%, 39%)",
  },
};

export const RateLimitTrendsChart = ({ logs, dateRange }: RateLimitTrendsChartProps) => {
  const isHourlyView = dateRange === "1";

  const chartData = useMemo(() => {
    if (!logs.length) return [];

    const now = new Date();
    
    if (isHourlyView) {
      // Hourly data for last 24 hours
      const hours = eachHourOfInterval({
        start: subDays(now, 1),
        end: now,
      });

      return hours.map((hour) => {
        const hourStart = startOfHour(hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

        const hourLogs = logs.filter((log) => {
          const logDate = parseISO(log.created_at);
          return logDate >= hourStart && logDate < hourEnd;
        });

        const warnings = hourLogs.filter((l) => l.action === "rate_limit_warning").length;
        const exceeded = hourLogs.filter((l) => l.action === "rate_limit_exceeded").length;

        return {
          date: format(hour, "HH:mm"),
          fullDate: format(hour, "MMM d, HH:mm"),
          warnings,
          exceeded,
          total: warnings + exceeded,
        };
      });
    } else {
      // Daily data
      const days = parseInt(dateRange) || 7;
      const dateInterval = eachDayOfInterval({
        start: subDays(now, days),
        end: now,
      });

      return dateInterval.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayLogs = logs.filter((log) => {
          const logDate = parseISO(log.created_at);
          return logDate >= dayStart && logDate < dayEnd;
        });

        const warnings = dayLogs.filter((l) => l.action === "rate_limit_warning").length;
        const exceeded = dayLogs.filter((l) => l.action === "rate_limit_exceeded").length;

        return {
          date: format(day, "MMM d"),
          fullDate: format(day, "MMM d, yyyy"),
          warnings,
          exceeded,
          total: warnings + exceeded,
        };
      });
    }
  }, [logs, dateRange, isHourlyView]);

  const actionTypeData = useMemo(() => {
    if (!logs.length) return [];

    const actionCounts: Record<string, { warnings: number; exceeded: number }> = {};

    logs.forEach((log) => {
      const actionType = (log.entity_id || "unknown").replace(/_/g, " ");
      if (!actionCounts[actionType]) {
        actionCounts[actionType] = { warnings: 0, exceeded: 0 };
      }
      if (log.action === "rate_limit_warning") {
        actionCounts[actionType].warnings++;
      } else {
        actionCounts[actionType].exceeded++;
      }
    });

    return Object.entries(actionCounts)
      .map(([name, counts]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        ...counts,
        total: counts.warnings + counts.exceeded,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [logs]);

  if (!logs.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Rate Limit Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No rate limit data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Rate Limit Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="by-action">By Action Type</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="warningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 100%, 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45, 100%, 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exceededGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        if (payload?.[0]?.payload?.fullDate) {
                          return payload[0].payload.fullDate;
                        }
                        return "";
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="warnings"
                  name="warnings"
                  stroke="hsl(45, 100%, 65%)"
                  strokeWidth={2}
                  fill="url(#warningsGradient)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="exceeded"
                  name="exceeded"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fill="url(#exceededGradient)"
                  stackId="1"
                />
              </AreaChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(45, 100%, 65%)" }} />
                <span className="text-sm text-muted-foreground">90% Warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                <span className="text-sm text-muted-foreground">Limit Exceeded</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="by-action">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart
                data={actionTypeData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                  className="text-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="warnings"
                  name="warnings"
                  fill="hsl(45, 100%, 65%)"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="exceeded"
                  name="exceeded"
                  fill="hsl(0, 84%, 60%)"
                  stackId="a"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(45, 100%, 65%)" }} />
                <span className="text-sm text-muted-foreground">90% Warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
                <span className="text-sm text-muted-foreground">Limit Exceeded</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
