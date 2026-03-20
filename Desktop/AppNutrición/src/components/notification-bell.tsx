"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getNotificacionesCount } from "@/app/actions/notificaciones";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getNotificacionesCount().then(setCount);
    const interval = setInterval(() => {
      getNotificacionesCount().then(setCount);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/notificaciones"
      className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title="Notificaciones"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
