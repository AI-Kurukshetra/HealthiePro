import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { HealthRecord, Profile } from "@/lib/types";

async function updateProfile(formData: FormData) {
  "use server";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("profiles").upsert({ id: user.id, full_name: fullName || null, phone: phone || null, dob: dob || null });
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    entity_type: "profile",
    entity_id: user.id,
    action: "profile_updated",
    metadata: { fullName, phone, dob }
  });

  revalidatePath("/profile");
}

async function addHealthRecord(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "").trim();
  const recordType = String(formData.get("record_type") ?? "").trim();
  const recordDate = String(formData.get("record_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!title || !recordType || !recordDate) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inserted } = await supabase
    .from("health_records")
    .insert({
      user_id: user.id,
      title,
      record_type: recordType,
      record_date: recordDate,
      notes: notes || null
    })
    .select("id")
    .single();

  if (inserted?.id) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      channel: "in_app",
      message: `Health record added: ${title}`
    });

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      entity_type: "health_record",
      entity_id: inserted.id,
      action: "health_record_created",
      metadata: { title, recordType, recordDate }
    });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export default async function ProfilePage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user && !demoMode) redirect("/login");

  let p: Profile | null = null;
  let healthRecords: HealthRecord[] = [];
  if (user) {
    const [{ data: profile }, { data: records }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, dob, role, created_at").eq("id", user.id).maybeSingle(),
      supabase
        .from("health_records")
        .select("id, user_id, title, record_type, notes, record_date, created_at")
        .eq("user_id", user.id)
        .order("record_date", { ascending: false })
    ]);
    p = profile as Profile | null;
    healthRecords = (records ?? []) as HealthRecord[];
  } else if (demoMode) {
    p = {
      id: "demo-user",
      full_name: "Demo Patient",
      phone: "+1 555 111 2222",
      dob: "1990-01-01",
      role: "patient",
      created_at: new Date().toISOString()
    };
    healthRecords = [
      {
        id: "demo-record",
        user_id: "demo-user",
        title: "Lipid Profile",
        record_type: "lab_result",
        notes: "LDL improving from last quarter.",
        record_date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString()
      }
    ];
  }

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Profile and Health Records</h1>
          <p className="muted">Manage personal profile and longitudinal health documents.</p>
        </div>

        <form action={updateProfile} className="card stack">
          <h2>Profile</h2>
          <label>
            Full name
            <input name="full_name" defaultValue={p?.full_name ?? ""} placeholder="Your full name" />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={p?.phone ?? ""} placeholder="+1 555 000 1111" />
          </label>
          <label>
            Date of birth
            <input name="dob" type="date" defaultValue={p?.dob ?? ""} />
          </label>
          <p className="muted">Role: {p?.role ?? "patient"}</p>
          <button type="submit">Save profile</button>
        </form>

        <form action={addHealthRecord} className="card stack">
          <h2>Add Health Record</h2>
          <label>
            Title
            <input name="title" required placeholder="Blood test report" />
          </label>
          <label>
            Record type
            <input name="record_type" required placeholder="lab_result" />
          </label>
          <label>
            Record date
            <input name="record_date" type="date" required />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Summary and key markers" />
          </label>
          <button type="submit">Add record</button>
        </form>

        <section className="stack">
          <h2>Record History</h2>
          {healthRecords.length === 0 ? (
            <p className="muted">No health records found.</p>
          ) : (
            healthRecords.map((r) => (
              <article key={r.id} className="card stack">
                <div className="row-between">
                  <h3>{r.title}</h3>
                  <span className="pill">{r.record_type}</span>
                </div>
                <p>{new Date(r.record_date).toLocaleDateString()}</p>
                {r.notes ? <p className="muted">{r.notes}</p> : null}
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
