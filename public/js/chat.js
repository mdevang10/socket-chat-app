const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $SendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//Templates
const messgaeTemplate = document.querySelector("#message-template").innerHTML;
const locationMessgaeTemplate = document.querySelector(
    "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    //New Message element
    const $newMessage = $messages.lastElementChild;

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    
    //Visible Height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (message) => {
    //console.log(message);
    const html = Mustache.render(messgaeTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (message) => {
    //console.log(message);
    const html = Mustache.render(locationMessgaeTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,users
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled");
    const message = e.target.elements.message.value;
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        } else {
            console.log("Message is delivered!");
        }
    });
});

$SendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser");
    }
    $SendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position);
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                $SendLocationButton.removeAttribute("disabled");
                console.log("Location Shared");
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
