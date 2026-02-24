import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Type assertion for body
    const { email, password, firstName, lastName, stripe_plan } = body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      stripe_plan?: string;
    };
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // 1. Create user in Supabase Auth (or look up if they already exist)
    let userId: string | undefined;
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
    });
    if (signUpData?.user) {
      userId = signUpData.user.id;
    } else if (signUpError?.message?.toLowerCase().includes("already been registered") || signUpError?.message?.toLowerCase().includes("already exists")) {
      // User already has an account — find them by email
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existing = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        return NextResponse.json({ error: "User already exists but could not be located." }, { status: 500 });
      }
      userId = existing.id;
    } else {
      return NextResponse.json({ error: signUpError?.message || "Failed to create user." }, { status: 500 });
    }
    // 2. Upsert subscription info
    const { error: upsertError } = await supabase
      .from("news_subscribed_clients")
      .upsert([
        {
          client_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          stripe_plan,
        },
      ], { onConflict: "email" });
    if (upsertError) {
      return NextResponse.json({ error: "Failed to update subscription table: " + upsertError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, userId });
  } catch {
    return NextResponse.json({ error: "Unhandled error." }, { status: 500 });
  }
}
