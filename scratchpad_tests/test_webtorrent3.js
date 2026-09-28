import WebTorrent from 'webtorrent';
const client = new WebTorrent();
client.add('magnet:?xt=urn:btih:fb660a31bac35ae959ae436cdc34bd1a632c70b0', (torrent) => {
  console.log('client.get by infoHash:', !!client.get(torrent.infoHash));
  console.log('client.get by magnet:', !!client.get('magnet:?xt=urn:btih:fb660a31bac35ae959ae436cdc34bd1a632c70b0'));
  console.log('client.torrents length:', client.torrents.length);
});
