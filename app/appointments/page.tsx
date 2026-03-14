import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/types";

async function createAppointment(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const providerName = String(formData.get("provider_name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title || !startsAt) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const room = `healthie-${user.id.slice(0, 8)}-${Date.now()}`;
  const consultationUrl = `https://meet.jit.si/${room}`;

  const { data: inserted } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      title,
      provider_name: providerName || null,
      starts_at: startsAt,
      consultation_url: consultationUrl,
      notes: notes || null,
      status: "scheduled"
    })
    .select("id")
    .single();

  if (inserted?.id) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      channel: "in_app",
      message: `Appointment booked: ${title} at ${new Date(startsAt).toLocaleString()}`
    });

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      entity_type: "appointment",
      entity_id: inserted.id,
      action: "appointment_created",
      metadata: { title, startsAt }
    });
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export default async function AppointmentsPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && !demoMode) redirect("/login");

  let appointments: Appointment[] = [];
  if (user) {
    const { data } = await supabase
      .from("appointments")
      .select("id, title, provider_name, starts_at, status, consultation_url, notes, created_at")
      .eq("user_id", user.id)
      .order("starts_at", { ascending: true });
    appointments = (data ?? []) as Appointment[];
  } else if (demoMode) {
    appointments = [
      {
        id: "demo-1",
        title: "General Checkup",
        provider_name: "Dr. Shah",
        starts_at: new Date().toISOString(),
        status: "scheduled",
        consultation_url: "https://meet.jit.si/healthie-demo-room",
        notes: "Discuss blood pressure trend.",
        created_at: new Date().toISOString()
      }
    ];
  }

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Appointments</h1>
          <p className="muted">Schedule consultations with provider and auto-generated teleconsult links.</p>
        </div>

        <form action={createAppointment} className="card stack">
          <h2>Book appointment</h2>
          <label>
            Title
            <input name="title" required placeholder="General checkup" />
          </label>
          <label>
            Provider name
            <input name="provider_name" placeholder="Dr. Shah" />
          </label>
          <label>
            Starts at
            <input name="starts_at" type="datetime-local" required />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Symptoms or agenda" />
          </label>
          <button type="submit">Create appointment</button>
        </form>

        <section className="stack">
          {appointments.length === 0 ? (
            <p className="muted">No appointments yet.</p>
          ) : (
            appointments.map((item) => (
              <article key={item.id} className="card stack">
                <div className="row-between">
                  <h3>{item.title}</h3>
                  <span className="pill">{item.status}</span>
                </div>
                <p>{new Date(item.starts_at).toLocaleString()}</p>
                <p className="muted">Provider: {item.provider_name ?? "TBD"}</p>
                {item.consultation_url ? (
                  <p>
                    <a href={item.consultation_url} target="_blank" rel="noreferrer">
                      Join consultation room
                    </a>
                  </p>
                ) : null}
                {item.notes ? <p className="muted">{item.notes}</p> : null}
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
