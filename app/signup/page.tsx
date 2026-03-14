"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <div className="auth-brand-corner" aria-label="Healthie brand">
        <span className="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" role="img">
            <circle cx="16" cy="16" r="16" fill="#006d77" />
            <path d="M16 7.8a4.6 4.6 0 0 1 4.4 3.2h2.3a1.1 1.1 0 0 1 0 2.2h-2.2v2.2a1.1 1.1 0 0 1-2.2 0v-2.2h-4.6v2.2a1.1 1.1 0 0 1-2.2 0v-2.2H9.3a1.1 1.1 0 1 1 0-2.2h2.3A4.6 4.6 0 0 1 16 7.8Zm0 2.2a2.4 2.4 0 0 0-2.3 1.6h4.6A2.4 2.4 0 0 0 16 10Zm-4.7 7.4h9.4a1.1 1.1 0 0 1 1.1 1.1v1.1a5.8 5.8 0 0 1-11.6 0v-1.1a1.1 1.1 0 0 1 1.1-1.1Z" fill="#e1f3f5" />
          </svg>
        </span>
        <span>Healthie</span>
      </div>
      <section className="card auth-card">
        <h1>Create Account</h1>
        <p className="muted">Start your Healthie journey.</p>
        <form onSubmit={onSubmit} className="stack">
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
