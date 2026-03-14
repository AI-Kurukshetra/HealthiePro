import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import type { CarePlan, CareTask } from "@/lib/types";

async function createCarePlan(formData: FormData) {
  "use server";
  const goal = String(formData.get("goal") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  if (!goal) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inserted } = await supabase
    .from("care_plans")
    .insert({ user_id: user.id, goal, due_date: dueDate || null, status: "active" })
    .select("id")
    .single();

  if (inserted?.id) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      channel: "in_app",
      message: `Care plan created: ${goal}`
    });
  }

  revalidatePath("/care-plans");
  revalidatePath("/dashboard");
}

async function createCareTask(formData: FormData) {
  "use server";
  const carePlanId = String(formData.get("care_plan_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const reminderAt = String(formData.get("reminder_at") ?? "").trim();
  if (!carePlanId || !title) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inserted } = await supabase
    .from("care_tasks")
    .insert({
      user_id: user.id,
      care_plan_id: carePlanId,
      title,
      is_done: false,
      reminder_at: reminderAt || null
    })
    .select("id")
    .single();

  if (inserted?.id) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      channel: "in_app",
      message: reminderAt ? `Task added with reminder: ${title}` : `Task added: ${title}`
    });
  }

  revalidatePath("/care-plans");
  revalidatePath("/notifications");
}

async function toggleTaskStatus(formData: FormData) {
  "use server";
  const taskId = String(formData.get("task_id") ?? "").trim();
  const nextState = String(formData.get("next_state") ?? "").trim() === "true";
  if (!taskId) return;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("care_tasks").update({ is_done: nextState }).eq("id", taskId).eq("user_id", user.id);

  revalidatePath("/care-plans");
  revalidatePath("/dashboard");
}

export default async function CarePlansPage() {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user && !demoMode) redirect("/login");

  let plans: CarePlan[] = [];
  let tasks: CareTask[] = [];
  if (user) {
    const [{ data: planData }, { data: taskData }] = await Promise.all([
      supabase
        .from("care_plans")
        .select("id, goal, status, due_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("care_tasks")
        .select("id, care_plan_id, user_id, title, is_done, reminder_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
    ]);
    plans = (planData ?? []) as CarePlan[];
    tasks = (taskData ?? []) as CareTask[];
  } else if (demoMode) {
    plans = [
      {
        id: "demo-plan",
        goal: "Reduce resting heart rate",
        status: "active",
        due_date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString()
      }
    ];
    tasks = [
      {
        id: "demo-task-1",
        care_plan_id: "demo-plan",
        user_id: "demo-user",
        title: "20 min cardio",
        is_done: false,
        reminder_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: "demo-task-2",
        care_plan_id: "demo-plan",
        user_id: "demo-user",
        title: "Meditation",
        is_done: true,
        reminder_at: null,
        created_at: new Date().toISOString()
      }
    ];
  }
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.is_done).length;
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <main>
      <NavBar />
      <section className="container stack-lg">
        <div>
          <h1>Care Plans, Reminders and Progress</h1>
          <p className="muted">Track long-term goals, task reminders, and completion trends.</p>
        </div>

        <section className="card stack">
          <h2>Progress Snapshot</h2>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <p>
            {doneTasks}/{totalTasks} tasks completed ({percent}%)
          </p>
        </section>

        <div className="grid-2">
          <form action={createCarePlan} className="card stack">
            <h2>Create care plan</h2>
            <label>
              Goal
              <input name="goal" required placeholder="Walk 8,000 steps daily" />
            </label>
            <label>
              Due date
              <input name="due_date" type="date" />
            </label>
            <button type="submit">Add care plan</button>
          </form>

          <form action={createCareTask} className="card stack">
            <h2>Add care task</h2>
            <label>
              Care plan
              <select name="care_plan_id" required>
                <option value="">Select plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.goal}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Task title
              <input name="title" required placeholder="Morning breathing exercise" />
            </label>
            <label>
              Reminder (optional)
              <input name="reminder_at" type="datetime-local" />
            </label>
            <button type="submit">Add task</button>
          </form>
        </div>

        <section className="stack">
          {plans.length === 0 ? (
            <p className="muted">No care plans yet.</p>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="card stack">
                <div className="row-between">
                  <h3>{plan.goal}</h3>
                  <span className="pill">{plan.status}</span>
                </div>
                <p className="muted">Due: {plan.due_date ? new Date(plan.due_date).toLocaleDateString() : "Not set"}</p>
                <div className="stack">
                  <h4>Tasks</h4>
                  {tasks.filter((t) => t.care_plan_id === plan.id).length === 0 ? (
                    <p className="muted">No tasks for this plan.</p>
                  ) : (
                    tasks
                      .filter((t) => t.care_plan_id === plan.id)
                      .map((task) => (
                        <article key={task.id} className="task-row">
                          <div>
                            <p className="task-line">
                              {task.is_done ? "[Done]" : "[Open]"} {task.title}
                            </p>
                            <p className="muted mini">
                              Reminder: {task.reminder_at ? new Date(task.reminder_at).toLocaleString() : "Not set"}
                            </p>
                          </div>
                          <form action={toggleTaskStatus}>
                            <input type="hidden" name="task_id" value={task.id} />
                            <input type="hidden" name="next_state" value={(!task.is_done).toString()} />
                            <button type="submit">{task.is_done ? "Mark open" : "Mark done"}</button>
                          </form>
                        </article>
                      ))
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
