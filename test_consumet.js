import { ANIME } from "@consumet/extensions";
async function test() {
  const gogo = new ANIME.Gogoanime();
  try {
    const res = await gogo.search('Jujutsu Kaisen');
    console.log('Gogo:', res.results.slice(0,2));
  } catch(e) { console.log('Gogo err:', e.message); }
  
  const zoro = new ANIME.Zoro();
  try {
    const res2 = await zoro.search('Jujutsu Kaisen');
    console.log('Zoro:', res2.results.slice(0,2));
  } catch(e) { console.log('Zoro err:', e.message); }
}
test();
