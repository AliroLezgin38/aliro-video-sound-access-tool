(async () => {
  const logEl = document.getElementById('log');
  function log(msg) { logEl.textContent += `\n${msg}`; }

  function getQuery(name, def = '') {
    const params = new URLSearchParams(location.search);
    return params.get(name) || def;
  }

  const roomId = getQuery('room', 'default');
  const preview = document.getElementById('preview');

  const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');

  let pc;
  let localStream;

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

    pc.onconnectionstatechange = () => {
      log('PC state: ' + pc.connectionState);
    };
  }

  ws.onopen = async () => {
    log('WS connected');
    ws.send(JSON.stringify({ type: 'join', role: 'publisher', roomId }));

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      preview.srcObject = localStream;
      createPeer();
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    } catch (e) {
      log('getUserMedia error: ' + e.message);
    }
  };

  ws.onmessage = async (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'offer') {
      if (!pc) createPeer();
      await pc.setRemoteDescription({ type: 'offer', sdp: msg.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp, roomId }));
      log('Answer sent');
    } else if (msg.type === 'candidate') {
      try {
        await pc.addIceCandidate(msg.candidate);
      } catch (e) {
        log('addIceCandidate error: ' + e.message);
      }
    } else if (msg.type === 'viewer-ready') {
      log('Viewer is ready');
    }
  };

  window.addEventListener('beforeunload', () => {
    try { ws.close(); } catch {}
    try { if (pc) pc.close(); } catch {}
    try { if (localStream) localStream.getTracks().forEach(t => t.stop()); } catch {}
  });
})(); 