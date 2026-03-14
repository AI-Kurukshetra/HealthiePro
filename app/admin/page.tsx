import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog, Profile } from "@/lib/types";

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export default async function AdminPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user && !demoMode) redirect("/login");

  const profile = user
    ? ((await supabase
        .from("profiles")
        .select("id, full_name, phone, dob, role, created_at")
        .eq("id", user.id)
        .maybeSingle()).data as Profile | null)
    : ({
        id: "demo-admin",
        full_name: "Demo Admin",
        phone: null,
        dob: null,
        role: "admin",
        created_at: new Date().toISOString()
      } as Profile);
  if (profile?.role !== "admin") {
    return (
      <main>
        <NavBar />
        <section className="container">
          <article className="card stack">
            <h1>Admin Dashboard</h1>
            <p className="error">Access denied. Assign `admin` role in `profiles` to use this page.</p>
          </article>
        </section>
      </main>
    );
  }

  const [usersRes, appointmentsRes, plansRes, tasksRes, logsRes] = user
    ? await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id,status", { count: "exact" }),
        supabase.from("care_plans").select("id,status", { count: "exact" }),
        supabase.from("care_tasks").select("id,is_done", { count: "exact" }),
        supabase
          .from("audit_logs")
          .select("id, action, entity_type, entity_id, created_at")
          .order("created_at", { ascending: false })
          .limit(20)
      ])
    : [
        { count: 24 },
        { count: 41, data: [{ status: "completed" }, { status: "scheduled" }] },
        { count: 19, data: [{ status: "completed" }, { status: "active" }] },
        { count: 57, data: [{ is_done: true }, { is_done: false }] },
        {
          data: [
            {
              id: "demo-log",
              action: "appointment_created",
              entity_type: "appointment",
              entity_id: "demo-1",
              created_at: new Date().toISOString()
            }
          ]
        }
      ];

  const appointmentRows = appointmentsRes.data ?? [];
  const completedAppointments = appointmentRows.filter((a) => a.status === "completed").length;
  const planRows = plansRes.data ?? [];
  const completedPlans = planRows.filter((p) => p.status === "completed").length;
  const taskRows = tasksRes.data ?? [];
  const doneTasks = taskRows.filter((t) => t.is_done).length;
  const auditLogs = (logsRes.data ?? []) as AuditLog[];

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Operational reporting, quality indicators, and audit visibility.</p>
        </div>

        <div className="grid-3">
          <article className="card">
            <h2>Total Users</h2>
            <p className="metric">{usersRes.count ?? 0}</p>
          </article>
          <article className="card">
            <h2>Total Appointments</h2>
            <p className="metric">{appointmentsRes.count ?? 0}</p>
            <p className="muted">Completion: {pct(completedAppointments, appointmentsRes.count ?? 0)}%</p>
          </article>
          <article className="card">
            <h2>Total Care Plans</h2>
            <p className="metric">{plansRes.count ?? 0}</p>
            <p className="muted">Completed: {pct(completedPlans, plansRes.count ?? 0)}%</p>
          </article>
        </div>

        <section className="card stack">
          <h2>Care Task Analytics</h2>
          <div className="analytics-grid">
            <div>
              <p className="muted">Task Completion</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct(doneTasks, tasksRes.count ?? 0)}%` }} />
              </div>
              <p>{doneTasks}/{tasksRes.count ?? 0} complete</p>
            </div>
            <div>
              <p className="muted">Appointment Fulfillment</p>
              <div className="progress-track">
                <div className="progress-fill alt" style={{ width: `${pct(completedAppointments, appointmentsRes.count ?? 0)}%` }} />
              </div>
              <p>{completedAppointments}/{appointmentsRes.count ?? 0} complete</p>
            </div>
          </div>
        </section>

        <section className="stack">
          <h2>Recent Audit Logs</h2>
          {auditLogs.length === 0 ? (
            <p className="muted">No logs found.</p>
          ) : (
            auditLogs.map((log) => (
              <article key={log.id} className="card">
                <p>
                  <strong>{log.action}</strong> on {log.entity_type}
                  {log.entity_id ? ` (${log.entity_id})` : ""}
                </p>
                <p className="muted">{new Date(log.created_at).toLocaleString()}</p>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
