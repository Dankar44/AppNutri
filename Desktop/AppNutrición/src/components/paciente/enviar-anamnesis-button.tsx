"use client";

import { useState } from "react";
import { ClipboardList, Loader2, Copy, Check, Mail, MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getOrCreatePreconsultaLink } from "@/app/actions/preconsulta";
import { enviarLinkPreconsulta } from "@/app/actions/email";

export function EnviarAnamnesisButton({
  pacienteId,
  pacienteEmail,
}: {
  pacienteId: string;
  pacienteEmail: string | null;
}) {
  const tp = useTranslations("patients.preconsulta");
  const [open, setOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [url, setUrl] = useState("");
  const [telefono, setTelefono] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  async function abrir() {
    setOpen(true);
    if (url) return; // ya generado en esta sesión
    setCargando(true);
    try {
      const res = await getOrCreatePreconsultaLink(pacienteId);
      if (res.ok && res.url) {
        setUrl(res.url);
        setTelefono(res.telefono ?? null);
      } else {
        toast.error(res.error || tp("errorEnviarEmail"));
        setOpen(false);
      }
    } catch {
      toast.error(tp("errorEnviarEmail"));
      setOpen(false);
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* el navegador puede bloquear el portapapeles; el input es seleccionable como alternativa */
    }
  }

  async function enviarEmail() {
    setEnviandoEmail(true);
    try {
      const res = await enviarLinkPreconsulta(pacienteId);
      if (res.ok) toast.success(tp("emailEnviado"));
      else toast.error(res.error || tp("errorEnviarEmail"));
    } catch {
      toast.error(tp("errorEnviarEmail"));
    } finally {
      setEnviandoEmail(false);
    }
  }

  function enviarWhatsapp() {
    if (!telefono) return;
    const tel = telefono.replace(/[^0-9]/g, "");
    const texto = `${tp("waTexto")} ${url}`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
      >
        <ClipboardList className="w-4 h-4" />
        {tp("botonAbrir")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{tp("compartirTitulo")}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{tp("compartirAyuda")}</p>

            {cargando ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {tp("generandoEnlace")}
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 h-10 rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={copiar}
                    className="px-3 rounded-lg border border-input hover:bg-muted transition-colors inline-flex items-center gap-1.5 text-sm shrink-0"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiado ? tp("enlaceCopiado") : tp("copiarEnlace")}</span>
                  </button>
                </div>

                {!pacienteEmail && !telefono && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{tp("sinContacto")}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  {pacienteEmail && (
                    <button
                      type="button"
                      onClick={enviarEmail}
                      disabled={enviandoEmail}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {enviandoEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {tp("enviarPorEmail")}
                    </button>
                  )}
                  {telefono && (
                    <button
                      type="button"
                      onClick={enviarWhatsapp}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {tp("enviarPorWhatsapp")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
