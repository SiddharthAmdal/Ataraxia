import { Link } from "react-router-dom";
import { formatRuntime, formatSeasonEpisode } from "../lib/formatters";
import type { Episode } from "../types/media";

type EpisodeListProps = {
  showId: string;
  episodes: Episode[];
};

export function EpisodeList({ showId, episodes }: EpisodeListProps) {
  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <div
          key={episode.id}
          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:flex-row md:items-center"
        >
          <div
            className="h-24 w-full rounded-2xl bg-slate-800 bg-cover bg-center md:w-40"
            style={{
              backgroundImage: episode.imageUrl
                ? `url(${episode.imageUrl})`
                : undefined
            }}
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-accentSoft">
              {formatSeasonEpisode(
                episode.parentIndexNumber,
                episode.indexNumber
              )}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {episode.name}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">
              {episode.overview || "Playback is handled through the Jellyfin HLS stream."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
            <span className="text-sm text-slate-400">
              {formatRuntime(episode.runtimeTicks)}
            </span>
            <Link
              to={`/shows/${showId}/watch/${episode.id}`}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accentSoft"
            >
              Play
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
