"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { cn, withTimeout } from "@/lib/utils";
import { enviarContactoMarca } from "@/app/actions/contacto-marca";

export function MarcasColaboradores() {
  const [phase, setPhase] = useState<"email" | "message" | "success">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = ((new FormData(e.currentTarget).get("email") as string) || "").trim();
    if (!v) return;
    setEmail(v);
    setPhase("message");
  }

  async function handleMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const asunto = ((fd.get("subject") as string) || "").trim();
    const mensaje = ((fd.get("message") as string) || "").trim();
    if (!asunto || !mensaje) return;
    setLoading(true);
    try {
      const res = await withTimeout(enviarContactoMarca({ email, asunto, mensaje }));
      if (res.ok) setPhase("success");
      else toast.error(res.error || "No se pudo enviar.");
    } catch {
      toast.error("No se pudo enviar.");
    } finally {
      setLoading(false);
    }
  }

  const slid = phase !== "email";

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-block text-green-800 dark:text-green-300 text-xs font-bold tracking-[0.18em] uppercase mb-4">
            Contáctanos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Colabora con{" "}
            <span className="bg-[#bdd9c5] dark:bg-[#2a5e3a] dark:text-green-100 px-2 -mx-0.5">Annonia</span>
          </h2>
        </div>
        <div className="relative grid lg:grid-cols-2 items-stretch bg-[#BFD6BE] dark:bg-[#1a3a24] rounded-[28px] overflow-hidden lg:min-h-[480px]">

          {/* Panel email (izquierda; define la altura en desktop) */}
          <div
            className={cn(
              "p-10 sm:p-16 flex-col justify-center max-w-xl order-2 lg:order-none",
              phase === "email" ? "flex" : "hidden lg:flex"
            )}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-4">
              ¿Eres una marca o colaborador?
            </h2>
            <p className="text-gray-700 dark:text-green-100/80 text-base sm:text-lg leading-relaxed mb-7">
              Trabajamos con marcas que comparten nuestros valores de salud y bienestar. Déjanos tu email y te contactaremos para hablar de tu propuesta.
            </p>
            <form onSubmit={handleEmail} className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 bg-white rounded-3xl sm:rounded-full p-1.5 max-w-md shadow-sm">
              <input
                name="email"
                type="email"
                required
                placeholder="Tu email de contacto"
                className="flex-1 min-w-0 bg-transparent outline-none px-4 py-2.5 text-gray-900 text-sm sm:text-base placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#4F8A55] hover:bg-[#3E6E43] text-white font-bold text-sm tracking-wide px-6 py-3 rounded-full transition-colors"
              >
                CONTACTAR
              </button>
            </form>
            <p className="mt-4 text-sm text-gray-600 dark:text-green-100/60">
              Tu <span className="underline underline-offset-2">privacidad</span> es importante para nosotros.
            </p>
          </div>

          {/* Imagen (derecha; se desliza a la izquierda al pasar a mensaje/éxito) */}
          <div
            className={cn(
              "relative overflow-hidden z-[2] order-1 lg:order-none min-h-[260px] lg:min-h-0 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]",
              slid && "lg:-translate-x-full"
            )}
          >
            <Image
              src="/images/landing/colaboradores.png"
              alt="Marcas y colaboradores de Annonia"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Overlay: formulario de mensaje */}
          <div
            className={cn(
              "p-10 sm:p-16 flex-col justify-center order-2 lg:order-none lg:absolute lg:top-0 lg:right-0 lg:w-1/2 lg:h-full lg:transition-opacity lg:duration-300 lg:delay-300",
              phase === "message" ? "flex lg:opacity-100" : "hidden lg:flex lg:opacity-0 lg:pointer-events-none"
            )}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-2">
              Cuéntanos tu propuesta
            </h2>
            <p className="text-sm text-gray-600 dark:text-green-100/70 leading-relaxed mb-5 max-w-md">
              Escríbenos un asunto y un mensaje y nuestro equipo te responderá lo antes posible.
            </p>
            <form onSubmit={handleMessage} className="flex flex-col gap-2.5 max-w-md">
              <input
                name="subject"
                type="text"
                required
                maxLength={200}
                placeholder="Asunto"
                className="w-full bg-white rounded-xl px-4 py-3 outline-none text-gray-900 text-sm sm:text-base shadow-sm placeholder:text-gray-400"
              />
              <textarea
                name="message"
                required
                rows={3}
                maxLength={5000}
                placeholder="Tu mensaje"
                className="w-full bg-white rounded-xl px-4 py-3 outline-none text-gray-900 text-sm sm:text-base shadow-sm resize-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="self-start bg-[#4F8A55] hover:bg-[#3E6E43] disabled:opacity-50 text-white font-bold text-sm tracking-wide px-8 py-3 rounded-full transition-colors mt-0.5"
              >
                {loading ? "ENVIANDO…" : "ENVIAR"}
              </button>
            </form>
          </div>

          {/* Overlay: éxito */}
          <div
            className={cn(
              "p-10 sm:p-16 flex-col justify-center order-2 lg:order-none lg:absolute lg:top-0 lg:right-0 lg:w-1/2 lg:h-full lg:transition-opacity lg:duration-300 lg:delay-100",
              phase === "success" ? "flex lg:opacity-100" : "hidden lg:flex lg:opacity-0 lg:pointer-events-none"
            )}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-3">
              ¡Mensaje enviado!
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-green-100/80 leading-relaxed max-w-md">
              Gracias por escribirnos. Nuestro equipo revisará tu propuesta y te contactará pronto.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
