let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

const displayFrame = document.getElementById('stream__box');
const videoFrames = document.getElementsByClassName('video__container');
let userIdInDisplayFrame = null;

const expandVideoFrame = e => {
  const child = displayFrame.children[0];
  if (child) {
    document.getElementById('streams__container').appendChild(child);
  }

  displayFrame.style.display = 'block';
  displayFrame.appendChild(e.currentTarget);
  userIdInDisplayFrame = e.currentTarget.id;

  for (let i = 0; i < videoFrames.length; i++) {
    if (videoFrames[i].id != userIdInDisplayFrame) {
      videoFrames[i].style.height = '100px';
      videoFrames[i].style.width = '100px';
    }
  }
};

for (let i = 0; i < videoFrames.length; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

const hideDisplayFrame = () => {
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  const child = displayFrame.children[0];
  document.getElementById('streams__container').appendChild(child);

  for (let i = 0; i < videoFrames.length; i++) {
    videoFrames[i].style.height = '300px';
    videoFrames[i].style.width = '300px';
  }
};

displayFrame.addEventListener('click', hideDisplayFrame);
