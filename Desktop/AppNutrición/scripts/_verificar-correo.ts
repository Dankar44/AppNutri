/**
 * Lo que hace el profesor o el alumno cuando abre el correo y pulsa «verificar».
 *
 * Las altas por enlace público nacen con el correo sin confirmar (9 sep 2026), así que cualquier
 * prueba que después inicie sesión con esa cuenta tiene que pasar por aquí primero. Es el mismo
 * enlace que se manda por correo, no un atajo: si la ruta de verificación se rompiera, las pruebas
 * se enterarían.
 */
import { generateVerifyToken } from "../src/lib/verify-email";
import type { Conexion } from "./_conexion-viva";

/** El enlace tal cual le llega al buzón. */
export async function enlaceDeVerificacion(
  client: Conexion,
  email: string,
  base = "http://localhost:3001",
): Promise<string> {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
  if (!rows.length) throw new Error(`no hay cuenta para ${email}`);
  return `${base}/auth/verify-email?token=${await generateVerifyToken(rows[0].id, email)}`;
}

/** Abre ese enlace de verdad, por HTTP, como si se pulsara desde el correo. */
export async function verificarCorreo(
  client: Conexion,
  email: string,
  base = "http://localhost:3001",
): Promise<void> {
  await fetch(await enlaceDeVerificacion(client, email, base), { redirect: "manual" });
}
