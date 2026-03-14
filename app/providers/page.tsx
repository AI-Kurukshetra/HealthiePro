import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProviderAvailability } from "@/lib/types";

async function createAvailability(formData: FormData) {
  "use server";
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!startsAt || !endsAt) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? "patient";
  if (role !== "provider" && role !== "admin") return;

  await supabase.from("provider_availability").insert({
    provider_user_id: user.id,
    provider_name: profile?.full_name ?? "Provider",
    starts_at: startsAt,
    ends_at: endsAt,
    is_booked: false
  });

  revalidatePath("/providers");
}

async function bookSlot(formData: FormData) {
  "use server";
  const slotId = String(formData.get("slot_id") ?? "").trim();
  if (!slotId) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: slot } = await supabase
    .from("provider_availability")
    .select("id, provider_name, starts_at, is_booked")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot || slot.is_booked) return;

  const room = `healthie-slot-${slotId.slice(0, 8)}`;
  const consultationUrl = `https://meet.jit.si/${room}`;

  await supabase.from("appointments").insert({
    user_id: user.id,
    title: `Consultation with ${slot.provider_name}`,
    provider_name: slot.provider_name,
    starts_at: slot.starts_at,
    consultation_url: consultationUrl,
    status: "scheduled",
    notes: "Booked via provider availability."
  });

  await supabase.from("provider_availability").update({ is_booked: true }).eq("id", slot.id);
  await supabase.from("notifications").insert({
    user_id: user.id,
    channel: "in_app",
    message: `Slot booked with ${slot.provider_name} on ${new Date(slot.starts_at).toLocaleString()}`
  });

  revalidatePath("/providers");
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

export default async function ProvidersPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user && !demoMode) redirect("/login");

  let profile: Profile | null = null;
  let slots: ProviderAvailability[] = [];
  if (user) {
    const [{ data: profileData }, { data: slotData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, dob, role, created_at").eq("id", user.id).maybeSingle(),
      supabase
        .from("provider_availability")
        .select("id, provider_user_id, provider_name, starts_at, ends_at, is_booked, created_at")
        .order("starts_at", { ascending: true })
    ]);
    profile = profileData as Profile | null;
    slots = (slotData ?? []) as ProviderAvailability[];
  } else if (demoMode) {
    profile = {
      id: "demo-user",
      full_name: "Demo Patient",
      phone: null,
      dob: null,
      role: "patient",
      created_at: new Date().toISOString()
    };
    slots = [
      {
        id: "slot-1",
        provider_user_id: "provider-1",
        provider_name: "Dr. Shah",
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 90000000).toISOString(),
        is_booked: false,
        created_at: new Date().toISOString()
      }
    ];
  }
  const role = profile?.role ?? "patient";

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Provider Availability</h1>
          <p className="muted">Providers can publish time slots and patients can book directly.</p>
        </div>

        {(role === "provider" || role === "admin") && (
          <form action={createAvailability} className="card stack">
            <h2>Publish availability slot</h2>
            <label>
              Start time
              <input name="starts_at" type="datetime-local" required />
            </label>
            <label>
              End time
              <input name="ends_at" type="datetime-local" required />
            </label>
            <button type="submit">Add slot</button>
          </form>
        )}

        <section className="stack">
          {slots.length === 0 ? (
            <p className="muted">No provider slots available.</p>
          ) : (
            slots.map((slot) => (
              <article key={slot.id} className="card row-between">
                <div className="stack-tight">
                  <h3>{slot.provider_name}</h3>
                  <p className="muted">
                    {new Date(slot.starts_at).toLocaleString()} - {new Date(slot.ends_at).toLocaleString()}
                  </p>
                  <p>{slot.is_booked ? "Booked" : "Available"}</p>
                </div>
                {!slot.is_booked && role === "patient" ? (
                  <form action={bookSlot}>
                    <input type="hidden" name="slot_id" value={slot.id} />
                    <button type="submit">Book slot</button>
                  </form>
                ) : null}
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
