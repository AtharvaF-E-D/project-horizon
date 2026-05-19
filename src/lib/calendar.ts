import { addDays, addMonths, addWeeks, format } from "date-fns";

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export function expandRecurrence(
  start: Date,
  end: Date,
  rule: Recurrence,
  until?: Date | null
): Array<{ start: Date; end: Date }> {
  if (rule === "none" || !until || until <= start) return [{ start, end }];
  const occurrences: Array<{ start: Date; end: Date }> = [];
  const duration = end.getTime() - start.getTime();
  let cursor = new Date(start);
  let i = 0;
  const MAX = 200;
  while (cursor <= until && i < MAX) {
    occurrences.push({ start: new Date(cursor), end: new Date(cursor.getTime() + duration) });
    if (rule === "daily") cursor = addDays(cursor, 1);
    else if (rule === "weekly") cursor = addWeeks(cursor, 1);
    else if (rule === "monthly") cursor = addMonths(cursor, 1);
    i++;
  }
  return occurrences;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toICSDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const esc = (s: string) =>
  (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export interface ICSEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  start: Date;
  end: Date;
  attendee_email?: string | null;
  recurrence_rule?: Recurrence;
  recurrence_until?: Date | null;
}

export function buildICS(ev: ICSEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Simplify CRM//EN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@simplify-crm`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(ev.start)}`,
    `DTEND:${toICSDate(ev.end)}`,
    `SUMMARY:${esc(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
  if (ev.location || ev.meeting_url) lines.push(`LOCATION:${esc(ev.meeting_url || ev.location || "")}`);
  if (ev.attendee_email) lines.push(`ATTENDEE:mailto:${ev.attendee_email}`);
  if (ev.recurrence_rule && ev.recurrence_rule !== "none") {
    const freq = ev.recurrence_rule.toUpperCase();
    let rrule = `RRULE:FREQ=${freq}`;
    if (ev.recurrence_until) rrule += `;UNTIL=${toICSDate(ev.recurrence_until)}`;
    lines.push(rrule);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(ev: ICSEvent) {
  const blob = new Blob([buildICS(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const gcalFmt = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}00Z`;

export function googleCalendarUrl(ev: ICSEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${gcalFmt(ev.start)}/${gcalFmt(ev.end)}`,
    details: ev.description || "",
    location: ev.meeting_url || ev.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(ev: ICSEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: ev.start.toISOString(),
    enddt: ev.end.toISOString(),
    body: ev.description || "",
    location: ev.meeting_url || ev.location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
