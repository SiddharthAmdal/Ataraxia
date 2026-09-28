import WebTorrent from 'webtorrent';
const client = new WebTorrent();
client.add('magnet:?xt=urn:btih:fb660a31bac35ae959ae436cdc34bd1a632c70b0', (torrent) => {
});
const t = client.get('magnet:?xt=urn:btih:fb660a31bac35ae959ae436cdc34bd1a632c70b0');
console.log('client.get() keys:', t ? Object.keys(t) : 'null');
