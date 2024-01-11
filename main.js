const APP_ID = '6cbed139e08f4341af73dfdf166bcea6';

const token = null;
const uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19032', 'stun:stun2.l.google.com:19032'] }],
};

const init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel('main');
  await channel.join();

  channel.on('MemberJoined', handleUserJoined);

  client.on('MessageFromPeer', handleMessageFromPeer);

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  document.getElementById('user-1').srcObject = localStream;
};

const handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text);
  console.log('Message: ', message);
};

const handleUserJoined = async MemberId => {
  console.log('A new user joined the channel:', MemberId);
  createOffer(MemberId);
};

const createOffer = async MemberId => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById('user-2').srcObject = remoteStream;

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('user-1').srcObject = localStream;
  }

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
      client.sendMessageToPeer({ text: JSON.stringify({ type: 'candidate', candidate: event.candidate }) }, MemberId);
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer({ text: JSON.stringify({ type: 'offer', offer }) }, MemberId);
};

init();
