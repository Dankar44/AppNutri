"use client";

import { useState } from "react";

interface AlimentoImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function AlimentoImage({ src, alt, className }: AlimentoImageProps) {
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-64 object-contain mx-auto"
        onError={() => setError(true)}
      />
    </div>
  );
}
