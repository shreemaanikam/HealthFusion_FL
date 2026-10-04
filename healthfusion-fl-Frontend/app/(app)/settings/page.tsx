"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useCurrentUser, roleLabels } from "@/lib/role-context";
import { DEMO_MODE, API_BASE_URL } from "@/lib/demo-mode";

export default function SettingsPage() {
  const user = useCurrentUser();

  return (
    <div>
      <PageHeader 
        eyebrow="System" 
        title="Settings" 
        description="View your profile, security, and environment configuration." 
      />
      
      <div className="p-6 max-w-4xl space-y-6">
        {/* Profile */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Profile</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-mist block mb-1">Full Name</label>
              <input type="text" readOnly className="w-full bg-paper border border-line rounded px-3 py-2 text-sm text-ink cursor-not-allowed focus:outline-none" value={user.name || user.fullName || ""} />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Email</label>
              <input type="text" readOnly className="w-full bg-paper border border-line rounded px-3 py-2 text-sm text-ink cursor-not-allowed focus:outline-none" value={user.email || ""} />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Role</label>
              <input type="text" readOnly className="w-full bg-paper border border-line rounded px-3 py-2 text-sm text-ink cursor-not-allowed focus:outline-none" value={roleLabels[user.role] || user.role} />
            </div>
            <div>
              <label className="text-xs text-mist block mb-1">Organization</label>
              <input type="text" readOnly className="w-full bg-paper border border-line rounded px-3 py-2 text-sm text-ink cursor-not-allowed focus:outline-none" value={user.organizationId ? `Organization #${user.organizationId}` : "Not assigned"} />
            </div>
          </div>
          <p className="mt-4 text-xs text-mist italic">These fields are READ-ONLY and managed by your organization's identity provider.</p>
        </section>

        {/* Security */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Security & Authentication</h2>
          <div className="space-y-4 text-sm text-slate">
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span>Session Status</span>
              <span className="text-green font-medium">Active (Authenticated)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span>Google Authentication</span>
              <span className="text-ink font-medium">Available (Single Sign-On enabled)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Multi-factor Authentication (MFA)</span>
              <span className="text-mist font-medium">PLANNED</span>
            </div>
          </div>
        </section>

        {/* Privacy & Environment */}
        <section className="bg-surface border border-line rounded p-6">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Privacy & Environment</h2>
          <div className="space-y-4 text-sm text-slate">
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span>Privacy Policy</span>
              <a href="/privacy-center" className="text-teal hover:underline font-medium">View Privacy Posture</a>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-line">
              <span>Environment Mode</span>
              <span className={DEMO_MODE ? "text-amber font-medium" : "text-teal font-medium"}>
                {DEMO_MODE ? "SIMULATION (Demo Mode)" : "LIVE"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>API Base URL</span>
              <span className="font-mono text-xs bg-paper px-2 py-1 rounded text-ink">{API_BASE_URL || "/api"}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
