import { Link } from "react-router-dom";
import type { MediaShow } from "../types/media";

type MediaCardProps = {
  show: MediaShow;
};

export function MediaCard({ show }: MediaCardProps) {
  return (
    <Link
      to={`/shows/${show.id}?title=${encodeURIComponent(show.name)}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/75 transition hover:-translate-y-1 hover:border-white/20"
    >
      <div
        className="aspect-[3/4] bg-slate-800 bg-cover bg-center"
        style={{
          backgroundImage: show.imageUrl ? `url(${show.imageUrl})` : undefined
        }}
      >
        <div className="flex h-full items-end bg-gradient-to-t from-black/90 via-black/25 to-transparent p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">
              {show.productionYear ?? "Library"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {show.name}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">
              {show.overview || "Open the detail page for episodes and playback."}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
