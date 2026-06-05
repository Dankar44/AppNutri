"use client";

import { useState } from "react";
import { Combobox } from "@/components/combobox";
import { PREFIJOS } from "@/lib/paises";
import { parsearTelefono, combinarTelefono } from "@/lib/telefono";

const OPCIONES_PREFIJO = PREFIJOS.map((p) => ({ value: p.dial, label: p.etiqueta }));

/**
 * Selector de prefijo de país + campo de número. Devuelve por onChange el teléfono
 * combinado y normalizado ("+34 612345678"). Si no hay prefijo elegido, devuelve
 * solo el número (para no romper datos antiguos sin prefijo).
 */
export function TelefonoInput({
  value,
  onChange,
  inputClassName,
  id,
  placeholder = "600 000 000",
}: {
  value: string;
  onChange: (v: string) => void;
  inputClassName?: string;
  id?: string;
  placeholder?: string;
}) {
  const inicial = parsearTelefono(value);
  const [prefijo, setPrefijo] = useState(inicial.prefijo);
  const [numero, setNumero] = useState(inicial.numero);

  function emitir(pref: string, num: string) {
    onChange(combinarTelefono(pref, num));
  }

  return (
    <div className="flex gap-2">
      <Combobox
        compact
        ariaLabel="Prefijo telefónico"
        value={prefijo}
        onChange={(v) => {
          setPrefijo(v);
          emitir(v, numero);
        }}
        options={OPCIONES_PREFIJO}
        placeholder="País"
        inputClassName={inputClassName}
        className="w-24 shrink-0"
      />
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={numero}
        onChange={(e) => {
          setNumero(e.target.value);
          emitir(prefijo, e.target.value);
        }}
        maxLength={15}
        placeholder={placeholder}
        className={`${inputClassName ?? ""} flex-1`}
      />
    </div>
  );
}
