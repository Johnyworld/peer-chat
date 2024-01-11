let localStream;
let remoteStream;
let peerConnection;

const servers = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19032', 'stun:stun2.l.google.com:19032'] }],
};

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  document.getElementById('user-1').srcObject = localStream;

  createOffer();
};

const createOffer = async () => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById('user-2').srcObject = remoteStream;

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    event.streams[0].getTrack().forEach(track => {
      remoteStream.addTrack();
    });
  };

  peerConnection.onicecandidate = async event => {
    if (event.candidate) {
      console.log('New ICE candidate: ', event.candidate);
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log('Offer: ', offer);
};

init();
