import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "app/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, content } = (await req.json()) as { email: string; content: string };
    if (!email || !content) {
      return NextResponse.json({ error: "Email and message content are required." }, { status: 400 });
    }
    const conn = await getDbConnection();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const contact_date = `${yyyy}-${mm}-${dd}`;
    await conn.request()
      .input("contact_date", contact_date)
      .input("email", email)
      .input("content", content)
      .query(`
        INSERT INTO customer_contact (contact_date, email, content)
        VALUES (@contact_date, @email, @content)
      `);
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
