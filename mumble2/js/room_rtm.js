const handleMemberJoined = async MemberId => {
  console.log('A new member has joined the room: ', MemberId);
  addMemberToDom(MemberId);

  const members = await channel.getMembers();
  updateMemberTotal(members);

  const { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
  addBotMessageToDom(`Welcome to the room ${name}! 👋🏻`);
};

const addMemberToDom = async MemberId => {
  const { name } = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

  const membersWrapper = document.getElementById('member__list');
  const memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
    <span class="green__icon"></span>
    <p class="member_name">${name}</p>
  </div>`;

  membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

const updateMemberTotal = async members => {
  const total = document.getElementById('members__count');
  total.innerText = members.length;
};

const handleMemberLeft = async MemberId => {
  removeMemberFromDom(MemberId);

  const members = await channel.getMembers();
  updateMemberTotal(members);
};

const removeMemberFromDom = async MemberId => {
  const memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
  const name = memberWrapper.getElementsByClassName('member_name')[0].textContent;
  addBotMessageToDom(`${name} has left the room.`);

  memberWrapper.remove();
};

const getMembers = async () => {
  const members = await channel.getMembers();
  updateMemberTotal(members);
  for (let i = 0; i < members.length; i++) {
    addMemberToDom(members[i]);
  }
};

const handleChannelMessage = async (messageData, MemberId) => {
  console.log('A new message was received');
  const data = JSON.parse(messageData.text);

  if (data.type === 'chat') {
    addMessageToDom(data.displayName, data.message);
  }

  if (data.type === 'user_left') {
    document.getElementById(`user-container-${data.uid}`).remove();
  }
};

const sendMessage = async e => {
  e.preventDefault();

  const message = e.target.message.value;
  channel.sendMessage({ text: JSON.stringify({ type: 'chat', message, displayName }) });
  addMessageToDom(displayName, message);
  e.target.reset();
};

const addMessageToDom = (name, message) => {
  const messagesWrapper = document.getElementById('messages');

  const newMessage = `<div class="message__wrapper">
    <div class="message__body">
      <strong class="message__author">${name}</strong>
      <p class="message__text">${message}</p>
    </div>
  </div>`;

  messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

  const lastMessage = document.querySelector('#messages .message__wrapper:last-child');
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }
};

const addBotMessageToDom = botMessage => {
  const messagesWrapper = document.getElementById('messages');

  const newMessage = `<div class="message__wrapper">
    <div class="message__body__bot">
      <strong class="message__author__bot">🤖 Mumble Bot</strong>
      <p class="message__text__bot">${botMessage}</p>
    </div>
  </div>`;

  messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

  const lastMessage = document.querySelector('#messages .message__wrapper:last-child');
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }
};

const leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
};

window.addEventListener('beforeunload', leaveChannel);
const messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
