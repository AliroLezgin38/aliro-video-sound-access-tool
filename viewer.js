(() => {
  const statusEl = document.getElementById('status');
  const roomEl = document.getElementById('room');
  const player = document.getElementById('player');

  function getQuery(name, def = '') {
    const params = new URLSearchParams(location.search);
    return params.get(name) || def;
  }

  const roomId = getQuery('room', 'default');
  roomEl.textContent = roomId;

  const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');

  let pc;

  function logStatus(msg) { statusEl.textContent = msg; }

  function createPeer() {
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate, roomId }));
      }
    };

    pc.ontrack = (e) => {
      if (!player.srcObject) {
        player.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      logStatus('Bağlantı durumu: ' + pc.connectionState);
    };
  }

  ws.onopen = async () => {
    logStatus('Sinyalleme bağlandı');
    ws.send(JSON.stringify({ type: 'join', role: 'viewer', roomId }));
  };

  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'publisher-ready') {
      if (!pc) createPeer();
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp, roomId }));
      logStatus('Teklif gönderildi, yanıt bekleniyor...');
    } else if (msg.type === 'answer') {
      await pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
      logStatus('Yanıt alındı, media başlıyor...');
    } else if (msg.type === 'candidate') {
      try {
        await pc.addIceCandidate(msg.candidate);
      } catch (e) {
        logStatus('ICE ekleme hatası: ' + e.message);
      }
    } else if (msg.type === 'publisher-left') {
      logStatus('Yayıncı ayrıldı');
      if (pc) { try { pc.close(); } catch {}; pc = null; }
      player.srcObject = null;
    }
  };

  window.addEventListener('beforeunload', () => { try { ws.close(); } catch {} });
})(); 