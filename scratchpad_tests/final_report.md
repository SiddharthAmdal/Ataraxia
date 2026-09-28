### Build & Runtime
- Backend startup: Successfully starts on `http://localhost:4000`, connects to MongoDB, and serves endpoints.
- Frontend startup: `npm run dev` successfully spins up Vite dev server.
- Backend health endpoint: Responds with `200 OK` and `{"ok":true,"instanceId":"..."}`.
- Frontend production build: Failed due to existing TypeScript errors related to Framer Motion typings (`Variants` type incompatibility) and missing `playSessionId` in `PlayerPage.tsx`. (Note: These were not introduced in PASS 2).
- TypeScript typecheck: Failed (no `typecheck` script, but `tsc -b` fails during build).
- Automated tests: No automated tests exist in the repository (no `test` script).

### Authentication
- Valid login returns a signed JWT token correctly.
- Invalid login returns a 401 Unauthorized status.
- Protected endpoints (like `/api/progress`) correctly reject requests without a token (401).
- Protected endpoints correctly reject requests with a fake/expired token (401).
- Authenticated requests with a valid `Bearer <token>` succeed.
- The `APP_PASSWORD` and JWT secret are successfully isolated to the backend environment variables (`server/.env`) and are not exposed in frontend builds.

### SSRF
- Tested proxy endpoints against a variety of internal/reserved IPs and hostnames.
- Blocked (400): `localhost`, `127.0.0.1`, `0.0.0.0`, `192.168.1.1`, `10.0.0.1`, `169.254.169.254`.
- Blocked IPv6 variants (400): `::1` and `::ffff:127.0.0.1`.
- Blocked invalid protocols/malformed URLs: `ftp://example.com`, `not_a_url`.
- Allowed (200/3xx): Legitimate external URLs like `https://google.com` or provider `.m3u8` playlists.

### TLS
- Searched entire repository for `NODE_TLS_REJECT_UNAUTHORIZED`.
- Zero matches found. The global TLS bypass has been successfully eliminated from the backend.

### CORS
- Verified that trusted origin (`http://localhost:5173` via `.env`) is allowed and reflects `Access-Control-Allow-Origin: http://localhost:5173`.
- Verified that untrusted origin (`https://evil.com`) is rejected (returns no ACAO header).
- Configuration successfully extracted to `CORS_ORIGINS` environment variable in `config.js`.

### Database
- MongoDB URI is loaded from `process.env.MONGODB_URI` via `config.js` rather than hardcoded.
- Watchlist import no longer performs a destructive `deleteMany`. It now utilizes safe `bulkWrite` with `upsert`, meaning failed imports do not erase existing data.
- Read/Write database failures in `progressStore.js` and `watchlistStore.js` now properly throw exceptions up to the router layer to return HTTP 500s, rather than silently returning empty arrays/nulls.
- `progress.js` coercion fixed: `played` correctly distinguishes "true", "false", missing, and invalid inputs.

### Torrent Selection
- Validation constraint bug fixed. Invalid batches and unsupported codecs are correctly rejected and cannot sneak back in via the fallback condition.
- Scoring mechanism implemented: Torrent selection now prioritizes highly seeded torrents from trusted groups (e.g., `[SubsPlease]`, `[Erai-raws]`) by awarding them a score boost, guaranteeing quality releases beat generic high-seeder batches.
- No candidates: Falls back to a clear `throw new Error` ("No valid torrent candidates found").
- Validated via direct `TorrentProvider.fetchEpisodeSources` tests.

### Streaming
- HLS source resolution, proxying, segment URL rewriting, HTTP Range requests, and 206 partial responses are all preserved and functioning correctly via `server/src/routes/streaming.js` and `media.js`.
- Error handling improved: Proxy catches upstream fetch failures and responds with proper HTTP statuses instead of crashing the Node process.

### Repository Security
- Hardcoded absolute paths (e.g. `/Users/Siddharth/...`) were completely scrubbed from the source code (only present in old Markdown docs).
- `mock_token` removed from frontend auth logic.
- `origin: "*"` removed from Express `cors()` middleware.
- Secrets extracted out of code and into gitignored `.env` files. `.env.example` templates created without real secrets.

### Remaining Issues
- **Frontend Build Failure**: The React frontend fails its production build (`npm run build`) due to unaddressed TypeScript interface mismatches in `HomePage.tsx` (Framer motion versions) and `PlayerPage.tsx` (missing fields). This did not break runtime, but needs fixing for deployment.

### Overall Status
VERIFIED WITH REMAINING ISSUES
