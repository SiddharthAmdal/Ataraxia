import WebTorrent from 'webtorrent';
const client = new WebTorrent();
const magnet = 'magnet:?xt=urn:btih:5cbb3f0bd9bae8a72d91680c8da5e021ed5ad58d&dn=%5BSubsPlease%5D%20Jujutsu%20Kaisen%20-%2001%20%281080p%29%20%5B4518EF4F%5D.mkv&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce';

client.add(magnet, (torrent) => {
    console.log('Torrent added');
    const file = torrent.files[0];
    console.log('File:', file.name, file.length);
    let downloaded = 0;
    const stream = file.createReadStream({ start: 0, end: 1024 * 1024 }); // 1MB
    const start = Date.now();
    stream.on('data', (chunk) => {
        downloaded += chunk.length;
    });
    stream.on('end', () => {
        console.log(`Downloaded 1MB in ${Date.now() - start}ms`);
        process.exit(0);
    });
});
setTimeout(() => {
    console.log('Timeout after 15s');
    process.exit(1);
}, 15000);
