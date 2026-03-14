import Link from "next/link";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";

function metricPercent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export default async function DashboardPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !demoMode) {
    redirect("/login");
  }

  let appointmentCount = 0;
  let activeCarePlans = 0;
  let unreadNotifications = 0;
  let recordCount = 0;
  let openSlots = 0;
  let doneTasks = 0;
  let totalTasks = 0;

  if (user) {
    const [a, c, n, r, s, t] = await Promise.all([
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("care_plans").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      supabase.from("health_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("provider_availability").select("id", { count: "exact", head: true }).eq("is_booked", false),
      supabase.from("care_tasks").select("is_done").eq("user_id", user.id)
    ]);
    appointmentCount = a.count ?? 0;
    activeCarePlans = c.count ?? 0;
    unreadNotifications = n.count ?? 0;
    recordCount = r.count ?? 0;
    openSlots = s.count ?? 0;
    const taskList = t.data ?? [];
    doneTasks = taskList.filter((task) => task.is_done).length;
    totalTasks = taskList.length;
  } else if (demoMode) {
    appointmentCount = 4;
    activeCarePlans = 2;
    unreadNotifications = 3;
    recordCount = 6;
    openSlots = 5;
    doneTasks = 7;
    totalTasks = 10;
  }

  const completion = metricPercent(doneTasks, totalTasks);
  const adherence = Math.min(100, Math.max(0, completion + 5));

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Care Dashboard</h1>
          <p className="muted">Track care outcomes, appointments, and readiness from one place.</p>
        </div>

        <div className="grid-3">
          <article className="card">
            <h2>Appointments</h2>
            <p className="metric">{appointmentCount ?? 0}</p>
            <Link href="/appointments">Open appointments</Link>
          </article>
          <article className="card">
            <h2>Active Care Plans</h2>
            <p className="metric">{activeCarePlans ?? 0}</p>
            <Link href="/care-plans">Review care plans</Link>
          </article>
          <article className="card">
            <h2>Health Records</h2>
            <p className="metric">{recordCount ?? 0}</p>
            <Link href="/profile">Manage records</Link>
          </article>
        </div>

        <div className="grid-3">
          <article className="card">
            <h2>Unread Alerts</h2>
            <p className="metric">{unreadNotifications ?? 0}</p>
            <Link href="/notifications">Open inbox</Link>
          </article>
          <article className="card">
            <h2>Open Provider Slots</h2>
            <p className="metric">{openSlots ?? 0}</p>
            <Link href="/providers">Book provider slot</Link>
          </article>
          <article className="card">
            <h2>Teleconsultation</h2>
            <p className="muted">Join links are attached per appointment.</p>
            <Link href="/appointments">Join session</Link>
          </article>
        </div>

        <section className="card stack">
          <h2>Care Progress Analytics</h2>
          <div className="analytics-grid">
            <div>
              <p className="muted">Task Completion</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <p>{completion}%</p>
            </div>
            <div>
              <p className="muted">Adherence Score</p>
              <div className="progress-track">
                <div className="progress-fill alt" style={{ width: `${adherence}%` }} />
              </div>
              <p>{adherence}%</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
