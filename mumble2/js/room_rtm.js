const handleMemberJoined = async MemberId => {
  console.log('A new member has joined the room: ', MemberId);
  addMemberToDom(MemberId);

  const members = await channel.getMembers();
  updateMemberTotal(members);
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
  memberWrapper.remove();
};

const getMembers = async () => {
  const members = await channel.getMembers();
  updateMemberTotal(members);
  for (let i = 0; i < members.length; i++) {
    addMemberToDom(members[i]);
  }
};

const leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
};

window.addEventListener('beforeunload', leaveChannel);
