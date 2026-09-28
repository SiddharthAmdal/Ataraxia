import WebTorrent from 'webtorrent';
const client = new WebTorrent();
console.log('Adding torrent via URL...');
const start = Date.now();
client.add('https://nyaa.si/download/2126444.torrent', (torrent) => {
  console.log('Ready in', Date.now() - start, 'ms');
  console.log('Files:', torrent.files.map(f => f.name));
  process.exit(0);
});
client.on('error', err => console.log('Client Error:', err.message));
