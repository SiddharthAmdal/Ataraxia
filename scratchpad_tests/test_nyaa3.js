import { si } from 'nyaapi';
async function test() {
  try {
    const q1 = `[SubsPlease] One Piece 01`;
    const r1 = await si.search(q1, 1, { category: '1_2' });
    console.log("OP 1:", r1.length > 0 ? r1[0].name : "No results for " + q1);
    
    const q2 = `[SubsPlease] Attack on Titan 01`;
    const r2 = await si.search(q2, 1, { category: '1_2' });
    console.log("AoT 1:", r2.length > 0 ? r2[0].name : "No results for " + q2);
  } catch (err) {
    console.error(err);
  }
}
test();
