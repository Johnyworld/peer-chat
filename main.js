const APP_ID = '6cbed139e08f4341af73dfdf166bcea6';

const token = null;
const uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');

if (!roomId) {
  window.location = 'lobby.html';
}

let localStream;
let remoteStream;
let peerConnection;

const servers = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19032', 'stun:stun2.l.google.com:19032'] }],
};

const init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel(roomId);
  await channel.join();

  channel.on('MemberJoined', handleUserJoined);
  channel.on('MemberLeft', handleUserLeft);

  client.on('MessageFromPeer', handleMessageFromPeer);

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('user-1').srcObject = localStream;
};

const handleUserLeft = MemberId => {
  document.getElementById('user-2').style.display = 'none';
  document.getElementById('user-1').classList.remove('small-frame');
};

const handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text);

  if (message.type === 'offer') {
    createAnswer(MemberId, message.offer);
  }

  if (message.type === 'answer') {
    addAnswer(message.answer);
  }

  if (message.type === 'candidate') {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
};

const handleUserJoined = async MemberId => {
  console.log('A new user joined the channel:', MemberId);
  createOffer(MemberId);
};

const createPeerConnection = async MemberId => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById('user-2').srcObject = remoteStream;
  document.getElementById('user-2').style.display = 'block';

  document.getElementById('user-1').classList.add('small-frame');

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('user-1').srcObject = localStream;
  }

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async event => {
    if (event.candidate) {
      client.sendMessageToPeer({ text: JSON.stringify({ type: 'candidate', candidate: event.candidate }) }, MemberId);
    }
  };
};

const createOffer = async MemberId => {
  await createPeerConnection(MemberId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer({ text: JSON.stringify({ type: 'offer', offer }) }, MemberId);
};

const createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);

  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  client.sendMessageToPeer({ text: JSON.stringify({ type: 'answer', answer }) }, MemberId);
};

const addAnswer = async answer => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

const leaveChannel = async MemberId => {
  await channel.leave();
  await client.logout();
};

const toggleCamera = async () => {
  const videoTrack = localStream.getTracks().find(track => track.kind === 'video');
  if (videoTrack.enabled) {
    videoTrack.enabled = false;
    document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)';
  } else {
    videoTrack.enabled = true;
    document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, 0.9)';
  }
};

const toggleMic = async () => {
  const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
  if (audioTrack.enabled) {
    audioTrack.enabled = false;
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)';
  } else {
    audioTrack.enabled = true;
    document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, 0.9)';
  }
};

window.addEventListener('beforeunload', leaveChannel);

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);

init();
