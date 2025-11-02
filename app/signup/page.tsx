"use client"

import { useState } from 'react'
import { supabase } from 'app/lib/supabaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [first_name, setFirstName] = useState('')
  const [last_name, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      // Insert a new row into news_subscribed_clients
      const newUser = signUpData?.user;
      if (newUser) {
        const { error: insertError } = await supabase
          .from('news_subscribed_clients')
          .insert([
            {
              user_id: newUser.id,
              email: email,
              first_name: first_name,
              last_name: last_name,
            },
          ]);
        if (insertError) {
          setMessage('Sign up succeeded, but failed to add to subscription table: ' + insertError.message);
        } else {
          setMessage('Check your inbox to confirm your email!');
        }
      } else {
        setMessage('Sign up succeeded, but user info missing.');
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm p-6 bg-white rounded-2xl shadow"
      >
        <h1 className="text-2xl font-semibold mb-4 text-center">Create Account</h1>

        <label className="block mb-2 text-sm font-medium">First Name</label>
        <input
          type="text"
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />

        <label className="block mb-2 text-sm font-medium">Last Name</label>
        <input
          type="text"
          value={last_name}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />

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
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Signing up…' : 'Sign Up'}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </form>
    </div>
  )
}