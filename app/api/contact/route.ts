import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseClient";
export async function POST(req: NextRequest) {
  try {
    const { email, content } = (await req.json()) as { email: string; content: string };
    if (!email || !content) {
      return NextResponse.json({ error: "Email and message content are required." }, { status: 400 });
    }
    const { error: insertError } = await supabase
      .from("customer_contact")
      .insert([
        { email, content }
      ]);
    if (insertError) {
      console.error("Contact form submission error:", insertError.message);
      return NextResponse.json({ error: "Failed to submit contact message.", details: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Contact message submitted successfully." });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Contact form submission error:", err.message, err.stack);
    } else {
      console.error("Contact form submission error:", err);
    }
    return NextResponse.json({ error: "An error occurred while submitting your message.", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
