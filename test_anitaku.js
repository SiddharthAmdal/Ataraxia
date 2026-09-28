import AnitakuProvider from './server/src/services/anitakuProvider.js';
async function test() {
  const provider = new AnitakuProvider();
  const res1 = await provider.search('JUJUTSU KAISEN');
  console.log('JJK:', res1.results.length, res1.results.slice(0,2));
  
  const res2 = await provider.search('Dragon Ball');
  console.log('DB:', res2.results.length, res2.results.slice(0,2));
}
test();
