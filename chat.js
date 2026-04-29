// Chat System Logic

let currentUser = null;
let userRole = null;
let currentConversation = null;
let conversationsList = {};

window.addEventListener('load', () => {
    userRole = localStorage.getItem('userRole');
    currentUser = localStorage.getItem('userId');

    if (!userRole || !currentUser) {
        window.location.href = 'index.html';
        return;
    }

    loadConversations();
});

// Load conversations
function loadConversations() {
    const chatRef = firebase.database().ref('chat');
    chatRef.orderByChild('participants').once('value').then((snapshot) => {
        conversationsList = {};
        const listElement = document.getElementById('conversation-list');
        listElement.innerHTML = '';

        snapshot.forEach((convoSnapshot) => {
            const convo = convoSnapshot.val();
            const convoId = convoSnapshot.key;

            if (convo.participants && convo.participants[currentUser]) {
                conversationsList[convoId] = convo;
                const item = createConversationItem(convoId, convo);
                listElement.appendChild(item);
            }
        });
    });
}

function createConversationItem(convoId, convo) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    if (currentConversation === convoId) item.classList.add('active');

    item.innerHTML = `
        <div class="conversation-name">${convo.name || 'Direct Message'}</div>
        <div class="conversation-preview">${convo.lastMessage || 'No messages yet'}</div>
    `;

    item.onclick = () => {
        selectConversation(convoId, convo);
    };

    return item;
}

function selectConversation(convoId, convo) {
    currentConversation = convoId;
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.conversation-item').classList.add('active');
    loadMessages(convoId);
}

function loadMessages(convoId) {
    const messagesRef = firebase.database().ref('chat/' + convoId + '/messages');
    messagesRef.orderByChild('timestamp').on('value', (snapshot) => {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        snapshot.forEach((msgSnapshot) => {
            const msg = msgSnapshot.val();
            const msgElement = document.createElement('div');
            msgElement.className = 'message' + (msg.senderId === currentUser ? ' own' : '');
            msgElement.innerHTML = `
                <div class="message-content">${msg.text}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(msgElement);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text || !currentConversation) return;

    const message = {
        senderId: currentUser,
        text: text,
        timestamp: new Date().toISOString()
    };

    firebase.database().ref('chat/' + currentConversation + '/messages').push().set(message).then(() => {
        input.value = '';
    });
}

function showNewChatDialog() {
    const name = prompt('Enter conversation name (or leave empty for direct message):');
    if (name !== null) {
        createNewConversation(name);
    }
}

function createNewConversation(name) {
    const conversationId = firebase.database().ref('chat').push().key;
    const conversation = {
        name: name || 'Direct Message',
        participants: { [currentUser]: true },
        createdAt: new Date().toISOString(),
        lastMessage: ''
    };

    firebase.database().ref('chat/' + conversationId).set(conversation).then(() => {
        loadConversations();
    });
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}