# API Notes

## Frontend-facing routes

### `GET /api/libraries`

Returns Jellyfin collection folders for the configured user.

### `GET /api/libraries/:libraryId/shows`

Returns mapped show cards for one library.

### `GET /api/shows/:showId`

Returns:

- Jellyfin show metadata
- Episode list
- Best-effort Jikan metadata

### `GET /api/playback/:itemId`

Returns a playback descriptor containing:

- rewritten same-origin HLS playlist URL
- direct stream fallback URL
- play session identifiers

### `GET /api/playback/:itemId/master.m3u8`

Fetches Jellyfin’s HLS master playlist, rewrites nested URIs, and serves it from the backend.

### `GET /api/playback/proxy`

Streams HLS segments and related playlist assets from Jellyfin through the backend.

### `GET /api/continue-watching`

Builds a library rail from recently updated progress entries.

### `GET /api/progress`

Returns stored watch progress.

### `PUT /api/progress/:itemId`

Stores:

- `positionTicks`
- `runtimeTicks`
- `played`
