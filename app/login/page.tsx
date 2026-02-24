"use client";
import Footer from "components/sections/Footer";
import Header from "components/sections/Header";
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
    <div className="min-h-screen bg-[#fdf6ee] overflow-x-hidden flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center py-16 px-4">
        <form
          onSubmit={e => { e.preventDefault(); handleLogin(); }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-card border border-gray-200 p-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Log In</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Welcome back to Nektaar</p>

          <label className="block mb-1 text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-lg py-2.5 px-4 text-sm mb-5 focus:outline-none focus:border-[#bfa76a] transition-colors"
          />

          <label className="block mb-1 text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-lg py-2.5 px-4 text-sm mb-6 focus:outline-none focus:border-[#bfa76a] transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 font-bold py-2.5 px-6 rounded-lg shadow text-base transition-transform duration-300 hover:-translate-y-0.5 mb-3"
            style={{ borderColor: '#bfa76a', color: '#bfa76a', background: 'transparent' }}
          >
            {loading ? "Processing…" : "Log In"}
          </button>

          <button
            type="button"
            className="w-full py-2.5 px-6 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-600 bg-transparent hover:border-gray-400 transition-colors mb-2"
            onClick={handleResetPassword}
          >
            Reset Password
          </button>

          <button
            type="button"
            className="w-full py-2.5 px-6 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-600 bg-transparent hover:border-gray-400 transition-colors"
            onClick={() => router.push("/unsubscribe")}
          >
            Manage Subscription
          </button>

          {message && (
            <p className="mt-5 text-center text-sm text-gray-700">{message}</p>
          )}
          {resetSent && (
            <p className="mt-5 text-center text-sm text-green-600">{resetSent}</p>
          )}
        </form>
      </main>
      <Footer />
    </div>
  );
}