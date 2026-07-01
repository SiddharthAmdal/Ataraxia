# Private Anime Streaming Platform

Personal-use streaming platform built around Jellyfin, with a custom React frontend and a thin Express orchestration layer.

## Workspace Layout

- `client` React + Vite + Tailwind frontend
- `server` Express backend proxy for Jellyfin, progress, and metadata enrichment
- `docs` API and architecture notes

## Prerequisites

- Node.js 20+
- A working Jellyfin server
- A Jellyfin API key
- Your Jellyfin single-user ID

## Run

```bash
npm install
npm run dev:server
npm run dev:client
```

Frontend runs on `http://localhost:5173`.

Backend runs on `http://localhost:4000`.

## Build

```bash
npm run build
```

## Configuration

Copy the example environment files before running:

- `client/.env.example`
- `server/.env.example`

The server expects Jellyfin to already be running locally or on your LAN.

### Client environment

```bash
cp client/.env.example client/.env
```

- `VITE_API_BASE_URL`: Express API base URL

### Server environment

```bash
cp server/.env.example server/.env
```

- `PORT`: Express server port
- `SERVER_PUBLIC_URL`: public URL the client should use for backend-generated playback links
- `JELLYFIN_URL`: your Jellyfin base URL
- `JELLYFIN_API_KEY`: Jellyfin API key
- `JELLYFIN_USER_ID`: single-user Jellyfin ID
- `JIKAN_BASE_URL`: Jikan API base URL

## What works today

- Jellyfin library browsing
- Show detail pages with episode lists
- HLS playback flow prepared through the backend
- Resume playback and continue watching
- Jikan metadata enrichment
- Responsive dark UI built with Tailwind

## Commands

### Frontend

```bash
npm run dev:client
```

### Backend

```bash
npm run dev:server
```

### Production build

```bash
npm run build
```

## Notes

- This project is content-agnostic and expects user-owned media inside Jellyfin.
- No scrapers, torrent tooling, or public sharing flows are included.
- Watch progress is persisted locally in `server/data/progress.json`.
