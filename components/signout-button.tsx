"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  userName: string;
};

export function SignOutButton({ userName }: SignOutButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/login");
    router.refresh();
    setIsSigningOut(false);
  }

  return (
    <div className="user-menu">
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="user-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="user-avatar" aria-hidden="true">
          {userName.slice(0, 1).toUpperCase()}
        </span>
        <span>{userName}</span>
      </button>
      {isOpen ? (
        <div className="user-dropdown" role="menu">
          <p className="user-dropdown-label">Signed in as</p>
          <p className="user-dropdown-name">{userName}</p>
          <button onClick={signOut} className="ghost-btn user-signout-btn" type="button" disabled={isSigningOut}>
            {isSigningOut ? "Signing out..." : "Sign out securely"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
