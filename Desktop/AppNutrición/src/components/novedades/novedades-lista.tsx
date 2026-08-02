"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { getNovedades } from "@/content/novedades";
import type { Locale } from "@/i18n/config";
import {
  esNueva,
  getCorteNovedades,
  marcarNovedadesVistas,
} from "@/lib/novedades-vistas";
import { NovedadEntrada } from "./novedad-entrada";

/**
 * Entrar aquí da las novedades por leídas, sea quien sea quien mire: apaga el
 * punto verde del menú (que también se pinta en la demo, donde no hay sesión de
 * Supabase) y deja de señalar como "Nuevo" lo ya visto. Es una preferencia de
 * lectura en el navegador, así que no necesita cuenta.
 */
export function NovedadesLista({ locale }: { locale: Locale }) {
  const novedades = getNovedades();
  // El corte se congela al montar: así en esta visita todavía se ve qué era
  // nuevo, aunque las acabemos de dar por leídas. El ref lo hace idempotente:
  // en desarrollo StrictMode ejecuta el efecto dos veces, y en la segunda
  // localStorage ya diría "leído hasta hoy" — sin esto no se vería ningún
  // "Nuevo" nunca.
  const corteRef = useRef<string | null>(null);
  const [corte, setCorte] = useState<string | null>(null);

  useEffect(() => {
    if (corteRef.current === null) {
      corteRef.current = getCorteNovedades();
      setCorte(corteRef.current);
    }
    const ultima = novedades[0]?.fecha;
    if (ultima) marcarNovedadesVistas(ultima);
    // Solo al montar: el contenido es estático.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lg:space-y-6">
      {novedades.map((novedad, i) => (
        <Fragment key={novedad.id}>
          {/* En móvil las entradas van seguidas, separadas por una línea;
              la caja (borde, fondo, esquinas) solo a partir de lg. */}
          {i > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 lg:hidden" />
          )}
          <NovedadEntrada
            novedad={novedad}
            locale={locale}
            esNueva={corte ? esNueva(novedad.fecha, corte) : false}
          />
        </Fragment>
      ))}
    </div>
  );
}
