'use strict';

const usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector("#chat-page");
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var logoutButton = document.querySelector('#logoutButton'); // Nuevo botón de salir

var stompClient = null; //* Será nuestro webSocket
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {

    username = document.querySelector('#name').value.trim();
    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    //* Subscribirse al Topic público
    stompClient.subscribe('/topic/public', onMessageReceived);

    //* Dígale el nombre de usuario al servidor
    stompClient.send('/app/chat.addUser',
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    );

    connectingElement.classList.add('hidden');
}

function onError() {
    connectingElement.textContent = 'No se pudo conectar al servidor WebSocket. Por favor, actualiza la página e inténtalo nuevamente.';
    connectingElement.style.color = 'red';
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' se ha unido!';

    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' salió!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]); //* Primera letra del remitente

        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if (messageContent && stompClient) {
       var chatMessage = {
           sender: username,
           content: messageContent,
           type: 'CHAT'
       };
        stompClient.send(
            '/app/chat.sendMessage',
            {},
         JSON.stringify(chatMessage)
        );
        messageInput.value = '';
    }
    event.preventDefault();
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    console.log('index: ' + index);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);

//Nueva función para manejar la salida del chat
function logout(event) {
    if (stompClient) {
        stompClient.send('/app/chat.sendMessage', {}, JSON.stringify({sender: username, type: 'LEAVE'}));
        stompClient.disconnect();
    }
    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');
    messageArea.innerHTML = ''; // Limpiar el área de mensajes
    connectingElement.classList.remove('hidden');
    connectingElement.textContent = 'Connecting...';
    event.preventDefault();
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
logoutButton.addEventListener('click', logout, true); // Evento para el botón de salir