import type { SuspensionStats } from "@/hooks/useSuspensionStats";
import { format } from "date-fns";

const formatDuration = (hours: number): string => {
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

const escapeCSV = (value: string | number): string => {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportStatsAsCSV = (stats: SuspensionStats, timeRange: string) => {
  const lines: string[] = [];
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");

  // Summary section
  lines.push("SUSPENSION STATISTICS REPORT");
  lines.push(`Generated,${timestamp}`);
  lines.push(`Time Range,Last ${timeRange} days`);
  lines.push("");

  // Summary cards
  lines.push("SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Active Suspensions,${stats.activeNow}`);
  lines.push(`Total Suspensions,${stats.totalSuspensions}`);
  lines.push(`Permanent Blocks,${stats.totalBlocks}`);
  lines.push(`Lifted,${stats.totalLifted}`);
  lines.push(`Modified,${stats.totalModified}`);
  lines.push("");

  // Duration stats
  lines.push("DURATION STATISTICS");
  lines.push("Metric,Value");
  lines.push(`Average Duration,${formatDuration(stats.durationStats.averageHours)}`);
  lines.push(`Median Duration,${formatDuration(stats.durationStats.medianHours)}`);
  lines.push(`Shortest,${formatDuration(stats.durationStats.shortestHours)}`);
  lines.push(`Longest,${formatDuration(stats.durationStats.longestHours)}`);
  lines.push(`Temporary Count,${stats.durationStats.temporaryCount}`);
  lines.push(`Permanent Count,${stats.durationStats.permanentCount}`);
  lines.push("");

  // Trends
  if (stats.trends.length > 0) {
    lines.push("DAILY TRENDS");
    lines.push("Date,Suspended,Blocked,Modified,Lifted");
    stats.trends.forEach((t) => {
      lines.push(`${t.date},${t.suspended},${t.blocked},${t.modified},${t.lifted}`);
    });
    lines.push("");
  }

  // Reason breakdown
  if (stats.reasonBreakdown.length > 0) {
    lines.push("SUSPENSION REASONS");
    lines.push("Reason,Count,Percentage");
    stats.reasonBreakdown.forEach((r) => {
      lines.push(`${escapeCSV(r.reason)},${r.count},${r.percentage}%`);
    });
    lines.push("");
  }

  // Top performers
  if (stats.topPerformers.length > 0) {
    lines.push("TOP ADMINS BY ACTIONS");
    lines.push("Admin Email,Action Count");
    stats.topPerformers.forEach((p) => {
      lines.push(`${escapeCSV(p.email)},${p.count}`);
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `suspension-stats-${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportStatsAsPDF = async (stats: SuspensionStats, timeRange: string) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm");
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Suspension Statistics Report", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated: ${timestamp} | Time Range: Last ${timeRange} days`, 14, yPos);
  doc.setTextColor(0);
  yPos += 12;

  // Summary table
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPos);
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Active Suspensions", String(stats.activeNow)],
      ["Total Suspensions", String(stats.totalSuspensions)],
      ["Permanent Blocks", String(stats.totalBlocks)],
      ["Lifted", String(stats.totalLifted)],
      ["Modified", String(stats.totalModified)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Duration stats
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Duration Statistics", 14, yPos);
  yPos += 2;

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Average Duration", formatDuration(stats.durationStats.averageHours)],
      ["Median Duration", formatDuration(stats.durationStats.medianHours)],
      ["Shortest", formatDuration(stats.durationStats.shortestHours)],
      ["Longest", formatDuration(stats.durationStats.longestHours)],
      ["Temporary Count", String(stats.durationStats.temporaryCount)],
      ["Permanent Count", String(stats.durationStats.permanentCount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Reason breakdown
  if (stats.reasonBreakdown.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Suspension Reasons", 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [["Reason", "Count", "Percentage"]],
      body: stats.reasonBreakdown.map((r) => [r.reason, String(r.count), `${r.percentage}%`]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Top admins
  if (stats.topPerformers.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Top Admins by Actions", 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [["Admin Email", "Action Count"]],
      body: stats.topPerformers.map((p) => [p.email, String(p.count)]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Trends (new page)
  if (stats.trends.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Trends", 14, yPos);
    yPos += 2;

    // Only include days with activity to keep the table manageable
    const activeTrends = stats.trends.filter(
      (t) => t.suspended + t.blocked + t.modified + t.lifted > 0
    );
    const trendsToShow = activeTrends.length > 0 ? activeTrends : stats.trends.slice(-14);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Suspended", "Blocked", "Modified", "Lifted"]],
      body: trendsToShow.map((t) => [
        t.date,
        String(t.suspended),
        String(t.blocked),
        String(t.modified),
        String(t.lifted),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
  }

  const fileTimestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
  doc.save(`suspension-stats-${fileTimestamp}.pdf`);
};
