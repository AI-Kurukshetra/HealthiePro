export type Role = "patient" | "provider" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  dob: string | null;
  role: Role;
  created_at: string;
};

export type HealthRecord = {
  id: string;
  user_id: string;
  title: string;
  record_type: string;
  notes: string | null;
  record_date: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  title: string;
  provider_name: string | null;
  starts_at: string;
  status: "scheduled" | "completed" | "cancelled";
  consultation_url: string | null;
  notes: string | null;
  created_at: string;
};

export type CarePlan = {
  id: string;
  goal: string;
  status: "active" | "paused" | "completed";
  due_date: string | null;
  created_at: string;
};

export type CareTask = {
  id: string;
  care_plan_id: string;
  user_id: string;
  title: string;
  is_done: boolean;
  reminder_at: string | null;
  created_at: string;
};

export type ProviderAvailability = {
  id: string;
  provider_user_id: string;
  provider_name: string;
  starts_at: string;
  ends_at: string;
  is_booked: boolean;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  message: string;
  channel: "in_app" | "email" | "sms";
  is_read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};
