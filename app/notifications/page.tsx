import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/lib/types";

async function markAllRead() {
  "use server";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export default async function NotificationsPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user && !demoMode) redirect("/login");

  let notifications: NotificationItem[] = [];
  if (user) {
    const { data } = await supabase
      .from("notifications")
      .select("id, message, channel, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    notifications = (data ?? []) as NotificationItem[];
  } else if (demoMode) {
    notifications = [
      {
        id: "n1",
        message: "Reminder: Drink water and complete your walking goal.",
        channel: "in_app",
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "n2",
        message: "Appointment confirmation sent by email.",
        channel: "email",
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div className="row-between">
          <div>
            <h1>Notifications</h1>
            <p className="muted">In-app alert center. Email/SMS channels are tracked in the same table.</p>
          </div>
          <form action={markAllRead}>
            <button type="submit">Mark all as read</button>
          </form>
        </div>

        <section className="stack">
          {notifications.length === 0 ? (
            <p className="muted">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <article key={n.id} className="card stack">
                <div className="row-between">
                  <h3>{n.message}</h3>
                  <span className="pill">{n.channel}</span>
                </div>
                <p className="muted">{new Date(n.created_at).toLocaleString()}</p>
                <p>{n.is_read ? "Read" : "Unread"}</p>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
