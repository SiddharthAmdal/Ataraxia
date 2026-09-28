import { si } from 'nyaapi';
async function test() {
  const query = "Beginning After the End";
  const results = await si.search(query, 20, { category: '1_2' });
  for (const v of results.slice(0, 3)) console.log(v.name);
}
test();
