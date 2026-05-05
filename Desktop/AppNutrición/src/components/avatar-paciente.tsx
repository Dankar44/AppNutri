import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPacienteProps {
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-16 h-16 sm:w-20 sm:h-20",
  xl: "w-20 h-20 sm:w-24 sm:h-24",
};

const textClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl sm:text-2xl",
  xl: "text-2xl sm:text-3xl",
};

const iconClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8 sm:w-10 sm:h-10",
  xl: "w-10 h-10 sm:w-12 sm:h-12",
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
        "rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10",
        sizeClasses[size]
      )}
    >
      {initials ? (
        <span className={cn("text-primary/70 font-semibold", textClasses[size])}>{initials}</span>
      ) : (
        <User className={cn("text-primary/50", iconClasses[size])} strokeWidth={1.5} />
      )}
    </div>
  );
}
