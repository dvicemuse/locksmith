
const { contextBridge, ipcRenderer } = require('electron');

// define a new console
var console=(function(oldCons){
    return {
        log: function(text){
            text = JSON.stringify(text);
            oldCons.log(text);
            // Your code
        },
        info: function (text) {
            text = JSON.stringify(text);
            oldCons.info(text);
            // Your code
        },
        warn: function (text) {
            text = JSON.stringify(text);
            oldCons.warn(text);
            // Your code
        },
        error: function (text) {
            text = JSON.stringify(text);
            oldCons.error(text);
            // Your code
        }
    };
}(window.console));

//Then redefine the old console
window.console = console;


ipcRenderer.on('fromMain', (event, data) => {

  
  //console.log(event)
  //var ele = document.getElementById('fromMainMsg');
  //ele.innerHTML = JSON.stringify(data);
  const custEvent = new CustomEvent('fromMainController', {
    bubbles: true,
    detail: data
  })
  window.dispatchEvent(custEvent);
});
/*
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
*/

contextBridge.exposeInMainWorld('electron', {
  dispatch: (event, name, args) => {
    var eventHash =  (Math.random() + 1).toString(36).substring(2);
    ipcRenderer.invoke('dispatch', event, name, {args, eventHash});    
    return eventHash;
  },
});