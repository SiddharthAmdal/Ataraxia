import axios from 'axios';

const query = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    title { romaji english native }
    episodes
    nextAiringEpisode { episode }
  }
}
`;

async function test() {
  try {
    const { data } = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { id: 113415 }
    });
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e.message);
  }
}
test();
