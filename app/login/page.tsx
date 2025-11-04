"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<string | null>(null);

  // Signup logic removed

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    setResetSent(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Logged in successfully!");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setMessage(null);
    setResetSent(null);
    if (!email) {
      setMessage("Please enter your email address to reset your password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin + "/reset-password" : undefined,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setResetSent("Password reset email sent. Please check your inbox.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={e => { e.preventDefault(); handleLogin(); }}
        className="w-full max-w-sm p-6 bg-white rounded-2xl shadow"
      >
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Log In
        </h1>

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Processing…" : "Log In"}
        </button>

        <button
          type="button"
          className="w-full mt-3 p-2 bg-blue-50 text-blue-700 rounded border border-blue-500 hover:bg-blue-100 transition"
          onClick={handleResetPassword}
        >
          Reset Password
        </button>

        <button
          type="button"
          className="w-full mt-2 p-2 bg-gray-50 text-gray-700 rounded border border-gray-400 hover:bg-gray-100 transition"
          onClick={() => router.push("/unsubscribe")}
        >
          Unsubscribe
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
        {resetSent && (
          <p className="mt-4 text-center text-sm text-green-600">{resetSent}</p>
        )}
      </form>
    </div>
  );
}