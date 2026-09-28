import { ANIME } from "@consumet/extensions";
async function test() {
  const hianime = new ANIME.Hianime();
  try {
    const res = await hianime.search('Jujutsu Kaisen');
    console.log('Hianime JJK:', res.results.slice(0,2));
  } catch(e) { console.log('Hianime err:', e.message); }
}
test();
