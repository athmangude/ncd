import { createAdminClient, corsHeaders } from "../_shared/supabase-admin.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return new Response(
        JSON.stringify({ error: "Phone and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (password.length !== 6 || !/^\d+$/.test(password)) {
      return new Response(
        JSON.stringify({ error: "Password must be a 6-digit PIN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ user: { id: data.user.id, phone: data.user.phone } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
