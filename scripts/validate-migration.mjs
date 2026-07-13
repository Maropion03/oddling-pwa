import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migrationUrls = [
  "../supabase/migrations/20260710150000_initial_schema.sql",
  "../supabase/migrations/20260712160000_add_wechat_openid.sql",
  "../supabase/migrations/20260712170000_default_profile_theme_light.sql",
].map((path) => new URL(path, import.meta.url));
const migration = (await Promise.all(migrationUrls.map((url) => readFile(url, "utf8"))))
  .map((source) => source.replace("create extension if not exists pgcrypto;", ""))
  .join("\n");
const db = new PGlite();

try {
  await db.exec(`
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create or replace function public.gen_random_bytes(requested integer) returns bytea language sql volatile as $$
      select substring(decode(md5(random()::text), 'hex') from 1 for requested)
    $$;
  `);
  await db.exec(migration);

  const tables = await db.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
  const expectedTables = [
    "avatars", "daily_entries", "daily_prompts", "guest_interactions", "mutations",
    "product_events", "profiles", "shares", "stickers",
  ];
  const actualTables = tables.rows.map((row) => row.table_name);
  if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
    throw new Error(`Unexpected tables: ${JSON.stringify(actualTables)}`);
  }

  const ownerId = "11111111-1111-4111-8111-111111111111";
  const otherId = "22222222-2222-4222-8222-222222222222";
  const avatarId = "33333333-3333-4333-8333-333333333333";
  await db.exec(`insert into auth.users (id) values ('${ownerId}'), ('${otherId}');`);
  await db.exec(`select set_config('request.jwt.claim.sub', '${ownerId}', false); set role authenticated;`);
  await db.exec(`
    insert into public.profiles (id, display_name) values ('${ownerId}', 'owner');
    insert into public.avatars (id, owner_id, name, seed, traits, parts)
    values ('${avatarId}', '${ownerId}', '团子', 'seed',
      '{"energy":50,"softness":50,"order":50,"social":50,"oddness":50}',
      '{"body":"bean","eyes":"dot","mouth":"smile","head":null,"back":null,"textures":["dots"],"handheld":null}');
  `);
  const profile = await db.query(`select theme, wechat_openid from public.profiles where id = '${ownerId}'`);
  if (profile.rows[0]?.theme !== "light" || profile.rows[0]?.wechat_openid !== null) {
    throw new Error(`Profile defaults are invalid: ${JSON.stringify(profile.rows[0])}`);
  }

  let rejectedOtherOwner = false;
  try {
    await db.exec(`insert into public.profiles (id, display_name) values ('${otherId}', 'intruder');`);
  } catch {
    rejectedOtherOwner = true;
  }
  if (!rejectedOtherOwner) throw new Error("RLS allowed writing another user's profile");

  await db.exec(`
    select public.submit_daily_result(
      '${ownerId}'::uuid,
      '${avatarId}'::uuid,
      '{"id":"44444444-4444-4444-8444-444444444444","date":"2026-07-10","questionId":"absurd-01","timezone":"Asia/Shanghai","answer":"留下一点勇气","traitDelta":{"oddness":3},"response":"收到。"}'::jsonb,
      '{"energy":50,"softness":50,"order":50,"social":50,"oddness":53}'::jsonb,
      '{"body":"bean","eyes":"dot","mouth":"smile","head":"sprout","back":null,"textures":["dots"],"handheld":null}'::jsonb,
      1,
      '{"id":"55555555-5555-4555-8555-555555555555","slot":"head","token":"sprout","label":"偷偷长高的芽","previousToken":null}'::jsonb,
      '{"id":"66666666-6666-4666-8666-666666666666","title":"答案已发芽","subtitle":"偷偷长高的芽","date":"2026-07-10","tone":"yellow"}'::jsonb
    );
  `);
  const counts = await db.query(`
    select
      (select count(*)::int from public.daily_entries) as entries,
      (select count(*)::int from public.mutations) as mutations,
      (select count(*)::int from public.stickers) as stickers,
      (select mutation_count from public.avatars where id = '${avatarId}') as mutation_count
  `);
  const result = counts.rows[0];
  if (result.entries !== 1 || result.mutations !== 1 || result.stickers !== 1 || result.mutation_count !== 1) {
    throw new Error(`Atomic daily write failed: ${JSON.stringify(result)}`);
  }

  console.log(`Migrations verified: ${actualTables.length} tables, profile defaults, owner RLS, and daily RPC atomic.`);
} finally {
  await db.close();
}
