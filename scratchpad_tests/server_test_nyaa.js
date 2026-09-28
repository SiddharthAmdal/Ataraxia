import { si } from 'nyaapi';
async function test() {
  try {
    const results = await si.search('One Piece 1000', 1, { category: '1_2', filter: 2 }); // 1_2 is Anime - English-translated, filter 2 is Trusted only
    console.log(results[0]?.magnet || "No results");
  } catch (err) {
    console.error(err);
  }
}
test();
