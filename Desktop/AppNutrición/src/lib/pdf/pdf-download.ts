export async function downloadPDF(
  htmlStr: string,
  filename: string
): Promise<void> {
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: htmlStr, filename }),
  });

  if (!res.ok) throw new Error("PDF generation failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
