import { si } from 'nyaapi';
async function test() {
  try {
    const q1 = `Attack on Titan 01`;
    const r1 = await si.search(q1, 1, { category: '1_2' });
    
    // Sort by seeders
    r1.sort((a, b) => parseInt(b.seeders) - parseInt(a.seeders));
    
    // Find first one that isn't a batch (doesn't contain "01-", "~", or "Batch")
    const best = r1.find(r => !/01-\d{2}/.test(r.name) && !/batch/i.test(r.name) && !/~\s*\d{2}/.test(r.name));
    
    console.log("AoT 1:", best ? best.name : "No results");
  } catch (err) {
    console.error(err);
  }
}
test();
