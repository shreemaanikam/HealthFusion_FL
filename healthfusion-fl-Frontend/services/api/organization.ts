import type { Organization } from "@/types/organization";

const demoOrganizations: Organization[] = [
  { id: "org-cit", name: "Chennai General Hospital", kind: "hospital", city: "Chennai", country: "IN" },
  { id: "org-mrm", name: "Meridian Regional Medical Center", kind: "hospital", city: "Bengaluru", country: "IN" },
  { id: "org-coord", name: "HealthFusion Coordination Council", kind: "coordinator", city: "Chennai", country: "IN" },
];

export async function listOrganizations(): Promise<Organization[]> {
  return demoOrganizations;
}
