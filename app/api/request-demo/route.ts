import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const { allowed, retryAfterMs } = rateLimit(ip, { limit: 3, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const { email, name, company } = (await req.json()) as {
      email: string;
      name?: string;
      company?: string;
    };

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from("demo_requests")
      .insert([{ email, name: name || null, company: company || null }]);

    if (insertError) {
      console.error("Demo request insertion error:", insertError.message);
      return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
    }

    return NextResponse.json({ message: "Demo request submitted successfully." });
  } catch (err) {
    console.error("Demo request error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
