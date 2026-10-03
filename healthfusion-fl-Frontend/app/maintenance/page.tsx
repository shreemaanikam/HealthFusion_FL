export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <span className="h-2.5 w-2.5 rounded-sm bg-teal" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">HealthFusion_FL is undergoing maintenance.</h1>
      <p className="mt-2 max-w-sm text-sm text-slate">
        The federated network is paused while we deploy an update. Predictions and reports will be unavailable
        briefly. No patient data is affected.
      </p>
    </main>
  );
}
