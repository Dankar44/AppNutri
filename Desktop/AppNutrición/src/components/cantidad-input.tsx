"use client";

import { useState, useRef, useEffect, type InputHTMLAttributes } from "react";

/**
 * Normaliza el texto de una cantidad MIENTRAS se teclea, para que el separador
 * decimal sea SIEMPRE el punto y no se cuele basura:
 *  - coma → punto ("1,5" → "1.5"), porque internamente todo se calcula con punto;
 *  - fuera letras y símbolos (un `type="text"` no los bloquea como hacía `number`);
 *  - un solo punto decimal;
 *  - sin ceros a la izquierda redundantes ("02" → "2", "00.5" → "0.5").
 * Se conserva lo que está "a medio teclear" ("2.", ".5") para no pelear con el
 * cursor; el blur ya lo deja canónico ("2." → "2", "1.50" → "1.5").
 */
export function normalizarCantidadTexto(raw: string): string {
  let s = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const i = s.indexOf(".");
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
  return s.replace(/^0+(?=\d)/, "");
}

type CantidadInputProps = {
  /** Valor confirmado por el padre (fuente de verdad para cálculos). */
  value: number;
  /** Se invoca SOLO con un número válido (> 0 y dentro de [min, max]). */
  onChange: (cantidad: number) => void;
  min?: number;
  max?: number;
  /** Si se indica, al perder el foco redondea al múltiplo más cercano (p. ej. 0.5
   *  en raciones de receta), para no dejar decimales sin sentido como 1,7 o 1,754. */
  redondearA?: number;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "min" | "max" | "type" | "onBlur"
>;

/**
 * Input de cantidad que SÍ se puede dejar vacío mientras se edita (borrar todo
 * para teclear desde cero) y que fuerza el punto como separador decimal. Guarda
 * el texto en local y solo emite al padre cuando hay un número válido; al perder
 * el foco lo deja canónico ("2." → "2") o, si quedó vacío/inválido, restaura el
 * último válido — un editor en vivo no debe persistir 0. (El SelectorAlimento
 * usa otra variante: en vez de restaurar, avisa y bloquea el botón "Añadir".)
 */
export function CantidadInput({
  value,
  onChange,
  min = 0,
  max = 10000,
  redondearA,
  ...rest
}: CantidadInputProps) {
  const [texto, setTexto] = useState(() => String(value));
  const ultimoValido = useRef(value);

  // Cambios externos del valor (−/+, cambio de unidad, refresco del servidor)
  // re-sincronizan el texto; teclear no, porque ahí value === ultimoValido.
  useEffect(() => {
    if (value !== ultimoValido.current) {
      ultimoValido.current = value;
      setTexto(String(value));
    }
  }, [value]);

  const esValido = (n: number) =>
    Number.isFinite(n) && n > 0 && n >= min && n <= max;

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={(e) => {
        const raw = normalizarCantidadTexto(e.target.value);
        setTexto(raw);
        const n = parseFloat(raw);
        if (esValido(n)) {
          ultimoValido.current = n;
          onChange(n);
        }
      }}
      onBlur={() => {
        const n = parseFloat(texto);
        if (!esValido(n)) {
          setTexto(String(ultimoValido.current));
          return;
        }
        // Canónico y, si procede, en pasos limpios (p. ej. 0,5 raciones): 1,7 → 1,5.
        const limpio = redondearA ? Math.round(n / redondearA) * redondearA : n;
        const final = Math.round(limpio * 1000) / 1000;
        setTexto(String(final));
        if (final !== ultimoValido.current) {
          ultimoValido.current = final;
          onChange(final);
        }
      }}
    />
  );
}
