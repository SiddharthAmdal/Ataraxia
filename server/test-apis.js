import fetch from "node-fetch";

async function testApi(url) {
  try {
    const res = await fetch(url);
    console.log(url, "Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("Success! Data length:", data.results?.length || Object.keys(data).length);
    }
  } catch (e) {
    console.log(url, "Failed:", e.message);
  }
}

async function test() {
  await testApi("https://consumet-api.herokuapp.com/anime/gogoanime/dragon");
  await testApi("https://api.consumet.org/anime/gogoanime/dragon");
  await testApi("https://api.aniwatch.org/api/v2/hianime/search?q=dragon");
}
test();
