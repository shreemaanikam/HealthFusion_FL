import type { AppUser, UserRole } from "@/types/user";

export function demoUserForRole(role: UserRole): AppUser {
  const byRole: Record<UserRole, AppUser> = {
    doctor: { id: "u-doc", name: "Dr. S. Anand", email: "s.anand@healthfusion.demo", role: "doctor", organizationId: "org-cit" },
    hospital_admin: { id: "u-admin", name: "P. Varadhan", email: "p.varadhan@healthfusion.demo", role: "hospital_admin", organizationId: "org-cit" },
    researcher: { id: "u-res", name: "R. Kapoor", email: "r.kapoor@healthfusion.demo", role: "researcher", organizationId: "org-coord" },
    system_admin: { id: "u-sysadmin", name: "A. Fernandes", email: "a.fernandes@healthfusion.demo", role: "system_admin", organizationId: "org-coord" },
  };
  return byRole[role];
}
