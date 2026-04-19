"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getNotificacionesCount } from "@/app/actions/notificaciones";

interface Props {
  initialCount?: number;
}

export function NotificationBell({ initialCount = 0 }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      getNotificacionesCount().then(setCount);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notificaciones"
      aria-label={`Notificaciones${count > 0 ? ` (${count} sin leer)` : ""}`}
      className="relative p-2.5 lg:p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors overflow-visible min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 flex items-center justify-center"
      title="Notificaciones"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0 right-0 min-w-[18px] h-[18px] lg:min-w-[16px] lg:h-[16px] rounded-full bg-red-500 text-white text-[10px] lg:text-[9px] font-bold flex items-center justify-center px-0.5 translate-x-1 -translate-y-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
