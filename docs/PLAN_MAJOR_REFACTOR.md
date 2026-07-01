# Plan: Major Refactor - Removing Jellyfin & Adding Categories

This document outlines the strategy for pivoting the Ataraxia Anime Portal from a Jellyfin-backed library to a standalone streaming platform with categories and enhanced player controls.

## 1. Objectives
- Remove all Jellyfin integration and dependencies.
- Implement a category-based discovery system on the Home and Discovery pages.
- Enhance the player experience with a "Custom-feel" native player (ArtPlayer) and external controls.
- Refactor the Watchlist and Continue Watching flow.

## 2. Technical Strategy

### Server-Side Changes
- **Jellyfin Removal:** Delete `server/src/services/jellyfinClient.js` and remove its usage from `media.js`.
- **New Category Endpoints:**
  - `GET /api/streaming/trending`: Fetch trending anime from Anilist.
  - `GET /api/streaming/popular`: Fetch popular anime from Anilist.
  - `GET /api/streaming/recent`: Fetch recent episodes from Anitaku/GogoAnime.
  - `GET /api/streaming/upcoming`: Fetch upcoming airing schedule.
- **Enhanced Watchlist:** Update the watchlist/progress storage to rely entirely on the local database (MongoDB), removing any sync attempts with Jellyfin.

### Client-Side Changes
- **New Custom Player (ArtPlayer):**
  - Integrate `artplayer` for a premium, custom-skinned viewing experience.
  - This player will support HLS (via `hls.js`), subtitles, and quality switching.
  - **External Controls:** Add a dedicated UI block below the player containing:
    - **Skip Intro:** Seeks to the end of the detected OP.
    - **Skip Outro:** Seeks to the end of the detected ED.
    - **Auto Next Episode:** A toggle state that automatically navigates to the next episode when the current one ends.
- **Home Page Refactor:**
  - Remove the "Jellyfin Library" section.
  - Implement rows for **Trending**, **Popular**, **Recent Episodes**, and **Upcoming**.
  - Keep the "Login" button for unauthenticated users.
- **Library/Watchlist Page Refactor:**
  - Move the "Continue Watching" rail to the **Watchlist Page**.
  - Add a "Remove from History" button to items in the Continue Watching section.
  - The Library page will now serve as a category-based discovery hub.

## 3. Detailed Implementation Steps

### Phase 1: Server Cleanup & Category API
1.  Remove Jellyfin configuration and client.
2.  Add category methods to `streamingRouter.js` using `@consumet/extensions`.
3.  Test endpoints via `curl`.

### Phase 2: Client UI - Home & Library
1.  Refactor `HomePage.tsx` to display the new categories.
2.  Refactor `LibraryPage.tsx` to fetch from the new streaming categories instead of Jellyfin.
3.  Update `MediaCard` to handle Anilist/Consumet IDs instead of Jellyfin UUIDs.

### Phase 3: The "Custom" Player Experience
1.  Install `artplayer`.
2.  Create an `ArtPlayer` wrapper component.
3.  Implement the "Below-Player Controls" in `PlayerPage.tsx`.
4.  Link the "Skip" buttons to the `ArtPlayer` seek logic using the already-fetched `skip-times` API.

### Phase 4: Watchlist & History
1.  Modify `WatchlistPage.tsx` to include the "Continue Watching" section.
2.  Add a `DELETE /api/progress/:itemId` endpoint on the server.
3.  Implement the removal logic in the UI.

## 4. Verification Plan
- **Categories:** Verify Home page loads Trending, Popular, etc.
- **Player:** Verify "Skip Intro" button successfully seeks the video to the end of the intro.
- **Auto-Next:** Verify the next episode starts automatically when the toggle is ON.
- **History:** Verify items can be removed from "Continue Watching".
- **Jellyfin Removal:** Ensure no API calls are made to Jellyfin and no errors are thrown regarding missing Jellyfin config.
