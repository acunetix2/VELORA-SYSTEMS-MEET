
export function generateGoogleCalendarLink(title: string, date: string, notes: string, meetingId: string) {
  const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(new Date(date).getTime() + 45 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
  const url = `${baseUrl}&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(notes + "\n\nJoin: " + window.location.origin + "/meet/" + meetingId)}&location=${encodeURIComponent(window.location.origin + "/meet/" + meetingId)}`;
  
  return url;
}

export function downloadICS(title: string, date: string, notes: string, meetingId: string) {
  const start = new Date(date).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const end = new Date(new Date(date).getTime() + 45 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DESCRIPTION:${notes} Join: ${window.location.origin}/meet/${meetingId}`,
    `LOCATION:${window.location.origin}/meet/${meetingId}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");
  
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
