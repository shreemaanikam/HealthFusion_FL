export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal">{eyebrow}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-slate">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
