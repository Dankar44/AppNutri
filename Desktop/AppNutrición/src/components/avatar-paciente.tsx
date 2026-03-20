import { cn } from "@/lib/utils";

interface AvatarPacienteProps {
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-20 h-20 text-2xl",
  xl: "w-24 h-24 text-3xl",
};

export function AvatarPaciente({ nombre, apellidos, fotoUrl, size = "md" }: AvatarPacienteProps) {
  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`${nombre} ${apellidos}`}
        className={cn("rounded-full object-cover shrink-0", sizeClasses[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0",
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
