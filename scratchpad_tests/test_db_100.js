import { si } from 'nyaapi';
async function test() {
  const query = "Dragon Ball 01 1080p";
  const results = await si.search(query, 100, { category: '1_2' });
  const title = "Dragon Ball";
  const epNum = "1";
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strictRegex = new RegExp(`${escapedTitle}\\s*[-:]?\\s*(?:s(?:eason)?\\s*\\d+\\s*)?(?:[-:]\\s*)?0*${epNum}\\b`, 'i');
  
  const valids = results.filter(r => strictRegex.test(r.name));
  console.log("Strict matches:", valids.length);
  for (const v of valids.slice(0, 3)) console.log(v.seeders, v.name);
}
test();
