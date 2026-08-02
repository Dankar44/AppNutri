"use client";

import { useEffect, useState } from "react";
import { BetaBanner } from "@/components/beta-banner";
import { NovedadesBanner } from "@/components/novedades/novedades-banner";
import { getNovedades } from "@/content/novedades";
import type { Locale } from "@/i18n/config";
import { bannerPendiente, descartarBannerNovedades } from "@/lib/novedades-vistas";

/**
 * Decide qué aviso va arriba del dashboard. Existe para que no se apilen dos
 * franjas: si hay una novedad destacada sin leer, manda esa; si no, el de beta.
 *
 * Cerrar el de novedades da por descartado también el de beta (lo hace
 * `descartarBannerNovedades`), para que cerrar un aviso no haga aparecer otro.
 */
export function BannersDashboard({ locale }: { locale: Locale }) {
  const [montado, setMontado] = useState(false);
  const [novedadVisible, setNovedadVisible] = useState(false);

  const destacada = getNovedades().find((n) => n.destacada);

  useEffect(() => {
    if (destacada) setNovedadVisible(bannerPendiente(destacada.fecha));
    setMontado(true);
  }, [destacada]);

  if (!montado) return null;

  if (destacada && novedadVisible) {
    return (
      <NovedadesBanner
        novedad={destacada}
        locale={locale}
        onCerrar={() => {
          descartarBannerNovedades(destacada.fecha);
          setNovedadVisible(false);
        }}
      />
    );
  }

  return <BetaBanner />;
}
