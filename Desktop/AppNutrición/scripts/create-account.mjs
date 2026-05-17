import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const [email, password, nombre = "", apellidos = ""] = process.argv.slice(2);

if (!email || !password) {
  console.error("Uso: node scripts/create-account.mjs <email> <password> [nombre] [apellidos]");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const authRes = await client.query(
    `INSERT INTO auth.users (
       instance_id, id, aud, role, email, encrypted_password,
       email_confirmed_at, created_at, updated_at,
       raw_app_meta_data, raw_user_meta_data,
       is_sso_user, is_anonymous,
       confirmation_token, recovery_token,
       email_change_token_new, email_change, email_change_token_current,
       reauthentication_token, phone_change, phone_change_token
     ) VALUES (
       '00000000-0000-0000-0000-000000000000',
       gen_random_uuid(),
       'authenticated', 'authenticated',
       $1,
       crypt($2, gen_salt('bf')),
       NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'email_verified', true, 'phone_verified', false),
       false, false,
       '', '', '', '', '', '', '', ''
     ) RETURNING id`,
    [email, password, nombre, apellidos]
  );

  const userId = authRes.rows[0].id;

  await client.query(
    `INSERT INTO auth.identities (
       id, user_id, provider_id, provider, identity_data,
       last_sign_in_at, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'provider', 'email'),
       NOW(), NOW(), NOW()
     )`,
    [userId, email]
  );

  const dietRes = await client.query(
    `INSERT INTO dietistas (
       id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"
     ) VALUES (
       gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()
     ) RETURNING id`,
    [userId, email, nombre, apellidos]
  );

  await client.query("COMMIT");
  console.log(`OK — ${email} creada (dietista: ${dietRes.rows[0].id})`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("ERROR:", e.message);
} finally {
  client.release();
  pool.end();
}
