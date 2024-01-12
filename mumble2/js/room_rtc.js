const APP_ID = '6cbed139e08f4341af73dfdf166bcea6';

let uid = sessionStorage.getItem('uid');
if (!uid) {
  uid = String(Math.floor(Math.random() * 10000));
  sessionStorage.setItem('uid', uid);
}

let token = null;
let client;

let rtmClient;
let channel;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
  roomId = 'main';
}

const displayName = sessionStorage.getItem('display_name');
if (!displayName) {
  window.location = 'lobby.html';
}

let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

const joinRoomInit = async () => {
  rtmClient = await AgoraRTM.createInstance(APP_ID);
  await rtmClient.login({ uid, token });

  await rtmClient.addOrUpdateLocalUserAttributes({ name: displayName });

  channel = await rtmClient.createChannel(roomId);
  await channel.join();

  channel.on('MemberJoined', handleMemberJoined);
  channel.on('MemberLeft', handleMemberLeft);
  channel.on('ChannelMessage', handleChannelMessage);

  getMembers();
  addBotMessageToDom(`Welcome to the room ${displayName}! 👋🏻`);

  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(APP_ID, roomId, token, uid);

  client.on('user-published', handleUserPublished);
  client.on('user-left', handleUserLeft);
};

const joinStream = async () => {
  document.getElementById('join-btn').style.display = 'none';
  document.getElementsByClassName('stream__actions')[0].style.display = 'flex';

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
    {},
    {
      encorderConfig: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
      },
    }
  );

  const player = `<div class="video__container" id="user-container-${uid}">
    <div class="video-player" id="user-${uid}"></div>
  </div>`;

  document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
  document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

  localTracks[1].play(`user-${uid}`);
  await client.publish([localTracks[0], localTracks[1]]);
};

const switchToCamera = async () => {
  const player = `<div class="video__container" id="user-container-${uid}">
    <div class="video-player" id="user-${uid}"></div>
  </div>`;
  displayFrame.insertAdjacentHTML('beforeend', player);

  await localTracks[0].setMuted(true);
  await localTracks[1].setMuted(true);

  document.getElementById('mic-btn').classList.remove('active');
  document.getElementById('screen-btn').classList.remove('active');

  localTracks[1].play(`user-${uid}`);
  await client.publish([localTracks[1]]);
};

const handleUserPublished = async (user, mediaType) => {
  remoteUsers[user.uid] = user;

  await client.subscribe(user, mediaType);

  const player = document.getElementById(`user-container-${user.uid}`);
  if (player === null) {
    const player = `<div class="video__container" id="user-container-${user.uid}">
      <div class="video-player" id="user-${user.uid}"></div>
    </div>`;

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
  }

  if (displayFrame.style.display) {
    const videoFrame = document.getElementById(`user-container-${user.uid}`);
    videoFrame.style.height = '100px';
    videoFrame.style.width = '100px';
  }

  if (mediaType === 'video') {
    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
};

const handleUserLeft = async user => {
  delete remoteUsers[user.uid];
  const item = document.getElementById(`user-container-${user.uid}`);
  if (item) {
    item.remove();
  }

  if (userIdInDisplayFrame === `user-container-${user.uid}`) {
    displayFrame.style.display = null;

    const videoFrames = document.getElementsByClassName('video__container');

    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '300px';
    }
  }
};

const toggleMic = async e => {
  const button = e.currentTarget;

  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    button.classList.add('active');
  } else {
    await localTracks[0].setMuted(true);
    button.classList.remove('active');
  }
};

const toggleCamera = async e => {
  const button = e.currentTarget;

  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    button.classList.add('active');
  } else {
    await localTracks[1].setMuted(true);
    button.classList.remove('active');
  }
};

const toggleScreen = async e => {
  const screenButton = e.currentTarget;
  const cameraButton = document.getElementById('camera-btn');

  if (!sharingScreen) {
    sharingScreen = true;

    screenButton.classList.add('active');
    cameraButton.classList.remove('active');
    cameraButton.style.display = 'none';

    localScreenTracks = await AgoraRTC.createScreenVideoTrack();

    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = 'block';

    const player = `<div class="video__container" id="user-container-${uid}">
      <div class="video-player" id="user-${uid}"></div>
    </div>`;

    displayFrame.insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);

    userIdInDisplayFrame = `user-container-${uid}`;
    localScreenTracks.play(`user-${uid}`);

    await client.unpublish([localTracks[1]]);
    await client.publish([localScreenTracks]);

    const videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; i < videoFrames.length; i++) {
      if (videoFrames[i].id != userIdInDisplayFrame) {
        videoFrames[i].style.height = '100px';
        videoFrames[i].style.width = '100px';
      }
    }
  } else {
    sharingScreen = false;
    cameraButton.style.display = 'block';
    document.getElementById(`user-container-${uid}`).remove();
    await client.unpublish([localScreenTracks]);

    switchToCamera();
  }
};

const leaveStream = async e => {
  e.preventDefault();

  document.getElementById('join-btn').style.display = 'block';
  document.getElementsByClassName('stream__actions')[0].style.display = 'none';

  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.unpublish([localTracks[0], localTracks[1]]);

  if (localScreenTracks) {
    await client.unpublish([localScreenTracks]);
  }

  document.getElementById(`user-container-${uid}`).remove();

  if (userIdInDisplayFrame === `user-container-${uid}`) {
    displayFrame.style.display = null;

    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '300px';
    }
  }

  channel.sendMessage({ text: JSON.stringify({ type: 'user_left', uid }) });
};

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('screen-btn').addEventListener('click', toggleScreen);
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveStream);

joinRoomInit();
