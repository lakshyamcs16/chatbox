const socket = io();

const form = document.querySelector('#chatbox');
const $messageFormInput = form.querySelector('input');
const $messageFormButton = form.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });


const autoscroll = () => {
    // New message eleemnt
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        url: message.url,
        username: message.username,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error) {
            return console.log(error);
        }

        console.log('Message Delivered!');
    });
});


$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords;
        socket.emit('sendLocation', {
            longitude, latitude
        }, () => {
            console.log('Location shared!');
            $locationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', {username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});