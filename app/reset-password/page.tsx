"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "app/lib/supabaseClient";

type Status = { type: "success" | "error"; message: string } | null;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    // Supabase v2 uses PKCE by default: the email link arrives as
    //   /reset-password?code=XXXX
    // We must exchange that code for a session before updateUser works.
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setStatus({ type: "error", message: "Invalid or expired reset link. Please request a new one." });
        } else {
          setReady(true);
        }
      });
      return;
    }

    // Fallback: implicit flow emits PASSWORD_RECOVERY via onAuthStateChange
    // (token in URL hash, older Supabase setups)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (password !== confirm) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setStatus({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Password updated successfully. Redirecting to login…" });
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-sm p-6 bg-white rounded-2xl shadow text-center">
          {status?.type === "error" ? (
            <>
              <p className="text-sm text-red-600">{status.message}</p>
              <button
                className="mt-4 text-sm text-blue-600 underline"
                onClick={() => router.push("/login")}
              >
                Back to login
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-600">Verifying reset link…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 bg-white rounded-2xl shadow"
      >
        <h1 className="text-2xl font-semibold mb-4 text-center">Set New Password</h1>

        <label className="block mb-2 text-sm font-medium">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className="w-full p-2 border rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Confirm New Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Repeat new password"
          className="w-full p-2 border rounded mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>

        {status && (
          <p className={`mt-4 text-center text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}
