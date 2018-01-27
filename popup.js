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

  chrome.tabs.query(queryInfo, (tabs) => {
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
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
}

/**
 * Gets the saved chat for the url.
 *
 * @param {string} url URL whose chat is to be retrieved.
 * @param {function(string)} callback called with the saved chat for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedChat(url, callback) {
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
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
  chrome.storage.sync.set(items);
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {

    const chatTitle = document.querySelector('#chatTitle');
    const messageBox = document.querySelector('#messageBox');

    chatTitle.innerHTML = url;

    messageBox.addEventListener('keypress', (e) => {
      if (e.keyCode == 13) {
        console.log('Enter pressed.');
      }
    });
  });
});