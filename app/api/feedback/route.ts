import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "../../lib/rateLimit";
import { supabase } from "../../lib/supabaseClient";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  const { allowed, retryAfterMs } = rateLimit(ip, { limit: 5, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const { email, feedback } = (await req.json()) as { email: string; feedback: string };
    if (!email || !feedback) {
      return NextResponse.json({ error: "Email and feedback are required." }, { status: 400 });
    }
    const { error: insertError } = await supabase
      .from("feedback")
      .insert([
        { email, feedback }
      ]);
    if (insertError) {
      console.error("Feedback submission error:", insertError.message);
      return NextResponse.json({ error: "Failed to submit feedback.", details: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Feedback submitted successfully." });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Feedback submission error:", err.message, err.stack);
    } else {
      console.error("Feedback submission error:", err);
    }
    return NextResponse.json({ error: "An error occurred while submitting feedback.", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
