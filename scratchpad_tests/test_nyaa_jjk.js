import { si } from 'nyaapi';
async function test() {
  const query = "jujutsu kaisen tv 1 1080p";
  const results = await si.search(query, 20, { category: '1_2' });
  console.log('Query:', query, 'Results:', results.length);
}
test();
