// Sends an email invitation to a new lecturer or staff member.
// Only an administrator can call this. The invite row decides the person's role when they accept.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Who is asking? The caller's sign-in token is checked here, so the function can run without the gateway JWT check.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!user) return json({ error: 'Please sign in again.' }, 401);

  const { data: me } = await admin.from('profiles').select('role, staff_role, active').eq('id', user.id).single();
  if (!me || me.role !== 'staff' || me.staff_role !== 'admin' || !me.active) {
    return json({ error: 'Only an administrator can invite lecturers and staff.' }, 403);
  }

  let body: { email?: string; name?: string; role?: string; staffRole?: string | null; redirectTo?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const email = (body.email ?? '').trim().toLowerCase();
  const name = (body.name ?? '').trim();
  const role = body.role;
  const staffRole = role === 'staff' ? (body.staffRole ?? 'registrar') : null;
  if (!/^\S+@\S+\.\S+$/.test(email) || !name) return json({ error: 'Enter a name and a valid email.' }, 400);
  if (role !== 'lecturer' && role !== 'staff') return json({ error: 'Role must be lecturer or staff.' }, 400);
  if (staffRole && !['admin', 'finance', 'registrar'].includes(staffRole)) return json({ error: 'Unknown staff role.' }, 400);

  const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) return json({ error: 'Someone already has an account with this email.' }, 409);

  const { error: invErr } = await admin.from('staff_invites')
    .upsert({ email, name, role, staff_role: staffRole, invited_by: user.id, accepted_at: null });
  if (invErr) return json({ error: invErr.message }, 400);

  const { error } = await admin.auth.admin.inviteUserByEmail(email, { data: { name }, redirectTo: body.redirectTo });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
});
