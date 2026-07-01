export function ErrorState({ message }: { message: string }) {
  return (
    <div className="glass-panel rounded-3xl border border-rose-500/20 p-10 text-center">
      <p className="text-lg font-semibold text-white">Something went wrong</p>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
    </div>
  );
}
