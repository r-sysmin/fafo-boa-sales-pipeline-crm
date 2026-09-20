import { supabase } from "@/integrations/supabase/client";

type StageRef = { id: string; name: string; position: number };

const demoCompanies = [
  { name: "Northwind Logistics", website: "https://northwindlogistics.com", industry: "Transportation" },
  { name: "Vertex Health Systems", website: "https://vertexhealth.io", industry: "Healthcare" },
  { name: "Brightpath Education", website: "https://brightpath.edu", industry: "Education" },
  { name: "Coastal Ridge Capital", website: "https://coastalridge.com", industry: "Financial Services" },
  { name: "Ironleaf Manufacturing", website: "https://ironleaf.co", industry: "Manufacturing" },
  { name: "Lumen Retail Group", website: "https://lumenretail.com", industry: "Retail" },
];

const demoContacts: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  company: string;
  tags: string[];
}[] = [
  { first_name: "Dana", last_name: "Whitfield", email: "dana.whitfield@northwindlogistics.com", phone: "+1 415 555 0142", position: "VP Operations", company: "Northwind Logistics", tags: ["demo", "decision-maker"] },
  { first_name: "Marcus", last_name: "Oyelaran", email: "marcus.o@northwindlogistics.com", phone: "+1 415 555 0177", position: "Fleet Manager", company: "Northwind Logistics", tags: ["demo"] },
  { first_name: "Priya", last_name: "Raghunathan", email: "priya.r@vertexhealth.io", phone: "+1 617 555 0388", position: "Chief Information Officer", company: "Vertex Health Systems", tags: ["demo", "champion"] },
  { first_name: "Elliot", last_name: "Brandt", email: "elliot.brandt@brightpath.edu", phone: "+1 312 555 0290", position: "Director of Technology", company: "Brightpath Education", tags: ["demo"] },
  { first_name: "Sofia", last_name: "Marchetti", email: "s.marchetti@coastalridge.com", phone: "+1 212 555 0631", position: "Head of Partnerships", company: "Coastal Ridge Capital", tags: ["demo", "decision-maker"] },
  { first_name: "Trevor", last_name: "Nakamura", email: "trevor.n@ironleaf.co", phone: "+1 503 555 0455", position: "Plant Director", company: "Ironleaf Manufacturing", tags: ["demo"] },
  { first_name: "Amara", last_name: "Diallo", email: "amara.diallo@lumenretail.com", phone: "+1 646 555 0719", position: "Regional Buyer", company: "Lumen Retail Group", tags: ["demo", "influencer"] },
  { first_name: "Grant", last_name: "Ellsworth", email: "grant.e@lumenretail.com", phone: "+1 646 555 0724", position: "CFO", company: "Lumen Retail Group", tags: ["demo", "economic-buyer"] },
];

const demoDeals: {
  title: string;
  company: string;
  contact: string;
  value: number;
  probability: number;
  stageIndex: number;
  closeInDays: number;
  notes: string;
}[] = [
  { title: "Northwind — Fleet Tracking Rollout", company: "Northwind Logistics", contact: "Dana Whitfield", value: 84000, probability: 60, stageIndex: 2, closeInDays: 24, notes: "Pilot across 3 depots, expanding to 11 if targets are met." },
  { title: "Vertex Health — Enterprise Platform", company: "Vertex Health Systems", contact: "Priya Raghunathan", value: 210000, probability: 75, stageIndex: 3, closeInDays: 41, notes: "Security review complete. Legal redlines outstanding." },
  { title: "Brightpath — Campus Licensing", company: "Brightpath Education", contact: "Elliot Brandt", value: 46500, probability: 40, stageIndex: 1, closeInDays: 58, notes: "Budget confirmed for next fiscal year." },
  { title: "Coastal Ridge — Advisory Seats", company: "Coastal Ridge Capital", contact: "Sofia Marchetti", value: 128000, probability: 55, stageIndex: 2, closeInDays: 33, notes: "Wants a phased rollout by desk." },
  { title: "Ironleaf — Plant Floor Expansion", company: "Ironleaf Manufacturing", contact: "Trevor Nakamura", value: 67500, probability: 30, stageIndex: 0, closeInDays: 72, notes: "Early discovery — evaluating two other vendors." },
  { title: "Lumen Retail — Regional Pilot", company: "Lumen Retail Group", contact: "Amara Diallo", value: 39000, probability: 90, stageIndex: 3, closeInDays: 12, notes: "Verbal yes from CFO, awaiting PO." },
  { title: "Lumen Retail — Annual Renewal", company: "Lumen Retail Group", contact: "Grant Ellsworth", value: 155000, probability: 100, stageIndex: 4, closeInDays: -9, notes: "Closed won. Multi-year with 8% uplift." },
  { title: "Northwind — Warehouse Add-on", company: "Northwind Logistics", contact: "Marcus Oyelaran", value: 22000, probability: 0, stageIndex: 5, closeInDays: -21, notes: "Lost to incumbent on price." },
];

const demoActivities: { deal: string; type: "call" | "email" | "meeting" | "note"; title: string; description: string }[] = [
  { deal: "Vertex Health — Enterprise Platform", type: "meeting", title: "Security review with IT", description: "Walked through SOC 2 controls and data residency." },
  { deal: "Northwind — Fleet Tracking Rollout", type: "call", title: "Discovery call with VP Operations", description: "Pain point: manual depot check-ins cost ~6 hrs/week." },
  { deal: "Coastal Ridge — Advisory Seats", type: "email", title: "Sent phased rollout proposal", description: "Three options: per-desk, per-region, firmwide." },
  { deal: "Lumen Retail — Regional Pilot", type: "note", title: "CFO gave verbal approval", description: "PO expected within the week." },
  { deal: "Brightpath — Campus Licensing", type: "meeting", title: "Budget planning session", description: "Funding earmarked for next fiscal year." },
];

const demoTasks: { deal: string; title: string; description: string; dueInDays: number; priority: string }[] = [
  { deal: "Vertex Health — Enterprise Platform", title: "Follow up on legal redlines", description: "Chase counsel for the updated MSA.", dueInDays: 2, priority: "high" },
  { deal: "Northwind — Fleet Tracking Rollout", title: "Send depot pilot scope", description: "Include success metrics for the 3-depot pilot.", dueInDays: 4, priority: "medium" },
  { deal: "Lumen Retail — Regional Pilot", title: "Confirm PO number", description: "Needed before provisioning accounts.", dueInDays: 1, priority: "high" },
  { deal: "Ironleaf — Plant Floor Expansion", title: "Schedule plant walkthrough", description: "Coordinate with the plant director's team.", dueInDays: 9, priority: "low" },
];

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export async function hasDemoData(): Promise<boolean> {
  const { count, error } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("is_demo", true);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function seedDemoWorkspace(userId: string, pipelineId: string, stages: StageRef[]) {
  if (!stages.length) throw new Error("No pipeline stages available to place demo deals in.");

  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const stageAt = (i: number) => ordered[Math.min(i, ordered.length - 1)].id;

  // Companies
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .insert(demoCompanies.map((c) => ({ ...c, created_by: userId, is_demo: true })))
    .select("id, name");
  if (companyError) throw companyError;

  const companyId = (name: string) => companies?.find((c) => c.name === name)?.id ?? null;

  // Contacts
  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .insert(
      demoContacts.map((c) => ({
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        position: c.position,
        tags: c.tags,
        company_id: companyId(c.company),
        created_by: userId,
        is_demo: true,
      })),
    )
    .select("id, first_name, last_name");
  if (contactError) throw contactError;

  const contactId = (fullName: string) =>
    contacts?.find((c) => `${c.first_name} ${c.last_name}` === fullName)?.id ?? null;

  // Deals
  const { data: deals, error: dealError } = await supabase
    .from("deals")
    .insert(
      demoDeals.map((d) => ({
        title: d.title,
        value: d.value,
        probability: d.probability,
        notes: d.notes,
        close_date: daysFromNow(d.closeInDays).toISOString().slice(0, 10),
        company_id: companyId(d.company),
        contact_id: contactId(d.contact),
        pipeline_id: pipelineId,
        stage_id: stageAt(d.stageIndex),
        owner_id: userId,
        created_by: userId,
        is_demo: true,
      })),
    )
    .select("id, title");
  if (dealError) throw dealError;

  const dealId = (title: string) => deals?.find((d) => d.title === title)?.id ?? null;

  // Activities
  const { error: activityError } = await supabase.from("activities").insert(
    demoActivities.map((a) => ({
      user_id: userId,
      deal_id: dealId(a.deal),
      type: a.type,
      title: a.title,
      description: a.description,
      is_demo: true,
    })),
  );
  if (activityError) throw activityError;

  // Tasks
  const { error: taskError } = await supabase.from("tasks").insert(
    demoTasks.map((t) => ({
      user_id: userId,
      deal_id: dealId(t.deal),
      title: t.title,
      description: t.description,
      due_date: daysFromNow(t.dueInDays).toISOString(),
      priority: t.priority,
      is_demo: true,
    })),
  );
  if (taskError) throw taskError;

  return {
    companies: companies?.length ?? 0,
    contacts: contacts?.length ?? 0,
    deals: deals?.length ?? 0,
  };
}

export async function clearDemoWorkspace() {
  // Children first to respect foreign keys.
  for (const table of ["activities", "tasks", "deals", "contacts", "companies"] as const) {
    const { error } = await supabase.from(table).delete().eq("is_demo", true);
    if (error) throw error;
  }
}
