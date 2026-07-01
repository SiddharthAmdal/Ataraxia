import AnitakuProvider from "./src/services/anitakuProvider.js";

const provider = new AnitakuProvider();

async function test() {
    const query = process.argv[2] || "The Beginning After the End";
    console.log(`Searching for: ${query}`);
    try {
        const search = await provider.search(query);
        console.log("Search Results:", JSON.stringify(search, null, 2));
        
        if (search.results.length > 0) {
            const id = search.results[0].id;
            console.log(`Fetching info for ID: ${id}`);
            const info = await provider.fetchAnimeInfo(id);
            console.log("Anime Info (Summary):", {
                id: info.id,
                title: info.title,
                episodeCount: info.episodes.length,
                episodes: info.episodes.slice(0, 5)
            });
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
