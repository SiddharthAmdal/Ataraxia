# Media Ingest Notes

## Current test source

- Source folder:
  `/Users/Siddharth/Documents/Anime/[Kaizoku] Jujutsu Kaisen Season 3 (WEB 1080p HEVC EAC-3)`

## Why a preprocessing step helps

Fansub-style filenames often use absolute numbering and release-group formatting, which can make Jellyfin season matching unreliable. To avoid touching the original files, this repo includes a symlink-based helper that builds a clean library structure for Jellyfin.

## Helper script

File:

- `/Users/Siddharth/Documents/HiAnimeClone/scripts/link-jellyfin-anime.mjs`

Example:

```bash
node scripts/link-jellyfin-anime.mjs \
  --source "/Users/Siddharth/Documents/Anime/[Kaizoku] Jujutsu Kaisen Season 3 (WEB 1080p HEVC EAC-3)" \
  --library-root "/Users/Siddharth/Documents/Anime/Jellyfin Library" \
  --show "Jujutsu Kaisen" \
  --season 3 \
  --offset 47
```

This creates symlinks like:

- `Jujutsu Kaisen - S03E01.mkv`
- `Jujutsu Kaisen - S03E02.mkv`

inside:

- `/Users/Siddharth/Documents/Anime/Jellyfin Library/Jujutsu Kaisen/Season 03`

## Current assumption

For the present Jujutsu Kaisen test folder, the source files use absolute-series episode numbering (`48` through `59`) rather than restarting from episode `1` for the season folder.

The helper currently maps those source files to season-relative Jellyfin links (`S03E01` through `S03E12`) because that naming convention is often easier for Jellyfin to match consistently in a season-based TV library.

That means:

- source numbering preserves the release group's absolute episode labels
- Jellyfin-facing symlink names are optimized for season matching
