# Architecture Notes

## Core Shape

- `client`: React + Vite frontend responsible for browsing libraries, rendering show detail pages, and playing HLS streams.
- `server`: Express layer that proxies Jellyfin APIs, enriches metadata with Jikan, and persists continue-watching state.
- `Jellyfin`: Source of truth for personal media files and playback streams.

## Data Flow

1. The frontend calls the Express API on `http://localhost:4000/api`.
2. The Express server proxies Jellyfin library and item requests using an API key and single-user ID.
3. Show detail responses are enriched with Jikan metadata when a title match is available.
4. The player requests an HLS master playlist through the server, which rewrites the playlist so HLS segment requests continue through the same backend.
5. Watch progress is stored in `server/data/progress.json` and mirrored in the browser for optimistic resume behavior.

## Assumptions

- Localhost only.
- Single user.
- No scraping, torrenting, or public distribution.
- Personal media already exists inside Jellyfin.
