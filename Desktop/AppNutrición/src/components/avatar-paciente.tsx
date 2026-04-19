import Image from "next/image";
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
  lg: "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl",
  xl: "w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl",
};

const sizePixels = { sm: 36, md: 44, lg: 80, xl: 96 };

export function AvatarPaciente({ nombre, apellidos, fotoUrl, size = "md" }: AvatarPacienteProps) {
  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  if (fotoUrl) {
    return (
      <Image
        src={fotoUrl}
        alt={`${nombre} ${apellidos}`}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className={cn("rounded-full object-cover shrink-0", sizeClasses[size])}
        loading="lazy"
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
