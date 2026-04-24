export function PulseLoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="flex items-end gap-[3px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[4px] rounded-full bg-primary"
            style={{
              height: `${12 + i * 4}px`,
              animation: `pulseBar 1s ease-in-out ${i * 0.12}s infinite`,
              opacity: 0.4 + i * 0.15,
            }}
          />
        ))}
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
      <style>{`
        @keyframes pulseBar {
          0%, 100% { transform: scaleY(0.6); opacity: 0.4; }
          50% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
