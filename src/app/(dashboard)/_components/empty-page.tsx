// Placeholder content for pages that are not built yet.
export default function EmptyPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-1 flex-col p-4 sm:p-7">
      <h1 className="sr-only">{title}</h1>
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-kb-surface/50 p-10">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
