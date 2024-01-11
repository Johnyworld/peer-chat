let localStream;
let remoteStream;

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  document.getElementById('user-1').srcObject = localStream;
};

init();
