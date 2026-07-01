import AnitakuProvider from './src/services/anitakuProvider.js';
import { META } from "@consumet/extensions";

async function testInfo() {
    const provider = new AnitakuProvider();
    const hianime = new META.Anilist(provider);

    try {
        console.log("Testing fetchAnimeInfo for JJK (113415)...");
        const info = await hianime.fetchAnimeInfo("113415");
        console.log("Title:", info.title);
        console.log("Description:", info.description ? info.description.substring(0, 100) + "..." : "MISSING");
        console.log("Relations count:", info.relations ? info.relations.length : 0);
        if (info.relations && info.relations.length > 0) {
            console.log("First Relation:", info.relations[0]);
        }
        console.log("Episodes count:", info.episodes ? info.episodes.length : 0);
    } catch (error) {
        console.error("Info Error:", error);
    }
}

testInfo();
