const APP_ID = '6cbed139e08f4341af73dfdf166bcea6';

let uid = sessionStorage.getItem('uid');
if (!uid) {
  uid = String(Math.floor(Math.random() * 10000));
  sessionStorage.setItem('uid', uid);
}

let token = null;
let client;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('room');

if (!roomId) {
  roomId = 'main';
}

let localTrack = [];
let remoteUsers = {};
