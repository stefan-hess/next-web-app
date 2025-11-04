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
    // 1. Check if user exists in Supabase Auth
    let userId: string | undefined;
    const { data: userList, error: userListError } = await supabase.auth.admin.listUsers();
    if (userListError) {
      return NextResponse.json({ error: userListError.message || "Failed to list users." }, { status: 500 });
    }
    const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (signUpError || !signUpData?.user) {
        return NextResponse.json({ error: signUpError?.message || "Failed to create user." }, { status: 500 });
      }
      userId = signUpData.user.id;
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
