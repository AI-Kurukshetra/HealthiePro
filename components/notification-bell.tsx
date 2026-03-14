"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (demoMode) {
      setCount(3);
      return;
    }

    let mounted = true;
    const supabase = createClient();

    async function loadUnreadCount() {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (mounted) setCount(unreadCount ?? 0);
    }

    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const badge = count > 99 ? "99+" : String(count);

  return (
    <Link href="/notifications" className="bell-link" aria-label={`Notifications ${count}`}>
      <span className="bell-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img">
          <path
            d="M12 4.2a5 5 0 0 0-5 5v2.4c0 .9-.3 1.8-.8 2.6L5 16.2h14l-1.2-2c-.5-.8-.8-1.7-.8-2.6V9.2a5 5 0 0 0-5-5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9.6 18.4a2.4 2.4 0 0 0 4.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      {count > 0 ? <span className="bell-badge">{badge}</span> : null}
    </Link>
  );
}
