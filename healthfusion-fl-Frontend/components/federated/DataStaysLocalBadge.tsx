export function DataStaysLocalBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="2.5" y="5" width="7" height="5.5" rx="1" />
        <path d="M4 5V3.5a2 2 0 0 1 4 0V5" />
      </svg>
      Patient data stays local
    </span>
  );
}
