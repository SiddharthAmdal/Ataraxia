import axios from "axios";

export async function mapMalIdsToAnilistIds(malIds) {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $ids, type: ANIME) {
          id
          idMal
        }
      }
    }
  `;

  const results = {};
  const chunks = [];
  
  // Split malIds into chunks of 50
  for (let i = 0; i < malIds.length; i += 50) {
    chunks.push(malIds.slice(i, i + 50).map(id => parseInt(id)));
  }

  for (const chunk of chunks) {
    try {
      const response = await axios.post("https://graphql.anilist.co", {
        query,
        variables: { ids: chunk }
      });

      const media = response.data.data.Page.media;
      media.forEach(m => {
        results[m.idMal] = m.id.toString();
      });
      
      // Wait a bit to respect rate limits if there are many chunks
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Error mapping MAL IDs to Anilist IDs:", error.response?.data || error.message);
    }
  }

  return results;
}
