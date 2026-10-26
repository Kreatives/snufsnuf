import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  {
    email: "bedrijf@snufsnuf.nl",
    password: "Snufsnuf2026!",
    role: "aanbieder",
    display_name: "Hondensalon Demo",
  },
  {
    email: "baasje@snufsnuf.nl",
    password: "Snufsnuf2026!",
    role: "baasje",
    display_name: "Lotte",
  },
];

for (const a of accounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: a.email,
    password: a.password,
    email_confirm: true,
    user_metadata: { role: a.role, display_name: a.display_name },
  });
  if (error) {
    console.log(`${a.email}: ${error.message}`);
  } else {
    console.log(`${a.email}: aangemaakt (${a.role}) id=${data.user.id}`);
  }
}
