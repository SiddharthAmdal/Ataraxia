export const TICKS_PER_SECOND = 10_000_000;

export function ticksToSeconds(ticks: number) {
  return ticks / TICKS_PER_SECOND;
}

export function secondsToTicks(seconds: number) {
  return Math.floor(seconds * TICKS_PER_SECOND);
}

export function formatRuntime(ticks: number) {
  const totalMinutes = Math.max(1, Math.round(ticksToSeconds(ticks) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatSeasonEpisode(
  parentIndexNumber?: number,
  indexNumber?: number
) {
  if (parentIndexNumber == null || indexNumber == null) {
    return "Special";
  }

  return `S${String(parentIndexNumber).padStart(2, "0")}E${String(
    indexNumber
  ).padStart(2, "0")}`;
}

export function progressPercent(positionTicks: number, runtimeTicks: number) {
  if (!runtimeTicks) {
    return 0;
  }

  return Math.min(100, Math.max(0, (positionTicks / runtimeTicks) * 100));
}
