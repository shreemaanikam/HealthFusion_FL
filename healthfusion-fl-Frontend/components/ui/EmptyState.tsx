export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-mist">{description}</p>}
    </div>
  );
}
