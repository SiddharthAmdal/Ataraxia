import { si } from 'nyaapi';
async function test() {
  try {
    const r1 = await si.search('ONE PIECE 1', 1, { category: '1_2' });
    console.log("OP 1:", r1.length > 0 ? r1[0].name : "No results");
    
    const r2 = await si.search('Attack on Titan 1', 1, { category: '1_2' });
    console.log("AoT 1:", r2.length > 0 ? r2[0].name : "No results");
  } catch (err) {
    console.error(err);
  }
}
test();
