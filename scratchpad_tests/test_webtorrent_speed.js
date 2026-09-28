import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const magnet = 'magnet:?xt=urn:btih:fb660a31bac35ae959ae436cdc34bd1a632c70b0&dn=One%20Piece%20S01E1161%20A%20Dangerous%20Deal%20Loki%20of%20the%20Underworld%20and%20Luffy%201080p%20BILI%20WEB-DL%20AAC2.0%20H%20264-VARYG%20(Multi-Subs)&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce';
console.log('Adding torrent...');
const start = Date.now();
client.add(magnet, (torrent) => {
  console.log('Ready in', Date.now() - start, 'ms');
  console.log('Files:', torrent.files.map(f => f.name));
  process.exit(0);
});
