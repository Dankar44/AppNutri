import Script from "next/script";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const type = String(data["@type"] ?? "json").toLowerCase().replace(/\W+/g, "-");
  return (
    <Script
      id={`ld-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
