const MESSAGE = 'MESSAGE';
const SET_URL = 'SET_URL';
const SET_NAME = 'SET_NAME';
const CONNECTED = 'CONNECTED';
const GET_MESSAGES = 'GET_MESSAGES';
let name = "";
let socket;

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome
    .tabs
    .query(queryInfo, (tabs) => {
      var tab = tabs[0];

      var url = tab.url;
      console.assert(typeof url == 'string', 'tab.url should be a string');

      callback(url);
    });
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = 'document.body.style.backgroundColor="' + color + '";';
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script is
  // inserted into the active tab of the current window, which serves as the
  // default.
  chrome
    .tabs
    .executeScript({code: script});
}

/**
 * Gets the saved chat for the url.
 *
 * @param {string} url URL whose chat is to be retrieved.
 * @param {function(string)} callback called with the saved chat for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedChat(url, callback) {
  chrome
    .storage
    .sync
    .get(url, (items) => {
      callback(chrome.runtime.lastError
        ? null
        : items[url]);
    });
}

/**
 * Saves the chat for the given URL.
 *
 * @param {string} url URL for which chat is to be saved for.
 * @param {string} chat The chat object to be saved.
 */
function saveChat(url, chat) {
  var items = {};
  items[url] = chat;
  chrome
    .storage
    .sync
    .set(items);
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    const chatTitle = document.querySelector('#chatTitle');
    const messageBox = document.querySelector('#messageBox');
    const chatTextBox = document.querySelector('#chatTextBox');
    const messages = document.querySelector('#messages');
    const username = document.querySelector("#username");

    socket = new WebSocket('ws://ws.cobaltium.net');

    socket.addEventListener('open', (event) => {
      socket.send(JSON.stringify({type: SET_URL, url}));
      socket.send(JSON.stringify({type: GET_MESSAGES}));
    });
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      switch(data.type) {
        case MESSAGE:
          messages.innerHTML += `<li> ${data.user.name}: ${data.message}</li>`
        break;
          case SET_NAME:
        break;
        case CONNECTED:
          console.log(data);
          name = data.name;
          username.innerHTML = name;
          break;
        case GET_MESSAGES:
          const newMessages = data.messages;
          if(newMessages) {
            newMessages.forEach((msg) => messages.innerHTML += `<li> ${msg.user.name}: ${msg.message}</li>`);
          }
          break;
      }
    });

    chatTextBox.addEventListener('keypress', (e) => {
      if(e.keyCode === 13) {
        e.preventDefault();
        handleMessage();
      }
    });

    chatTitle.innerHTML = `<strong>Domain:</strong> ${/^https?\:\/\/(?:www\.)?([\w\d]+\.\w+)/.exec(url)[1]}`;
  });
});
function handleMessage() {
  const msg = document.getElementById("chatTextBox").value;
  var innerVal = `<li> ${document.getElementById("username").innerHTML}: ${msg} </li>`;
  var message = document.getElementById("messages");
  message.innerHTML += innerVal;
  socket.send(JSON.stringify({type: MESSAGE, message: msg}));
  chatTextBox.value = "";
}

// Need window on load to wait for the dom to first load, then start running
// functions
window.onload = function () {
  //This is when someone submits a message
  document.querySelector("#submitButton").addEventListener("click", handleMessage);
};