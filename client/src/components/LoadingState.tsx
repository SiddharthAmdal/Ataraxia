export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="glass-panel rounded-3xl p-10 text-center text-slate-300">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      <p className="mt-4 text-sm">{label}</p>
    </div>
  );
}
