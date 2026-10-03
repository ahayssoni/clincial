'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function on(channel, callback) {
  const handler = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('moss', {
  platform: process.platform,
  getState: () => ipcRenderer.invoke('state:get'),
  onState: (callback) => on('state', callback),
  onVeilLeave: (callback) => on('veil:leave', callback),
  onSound: (callback) => on('sound', callback),
  act: (type) => ipcRenderer.send('act', type),
  updateSettings: (patch) => ipcRenderer.send('settings:update', patch),
  setIntention: (text) => ipcRenderer.send('intention', text),
  openFocusDisplay: (displayId) => ipcRenderer.send('focus:open', displayId ?? null),
  closeFocusDisplay: () => ipcRenderer.send('focus:close'),
  openSettings: () => ipcRenderer.send('settings:open'),
  showMenu: () => ipcRenderer.send('menu:show'),
  previewSound: (name) => ipcRenderer.send('sound:preview', name),
  quit: () => ipcRenderer.send('app:quit'),
  widget: {
    setIgnoreMouse: (ignore) => ipcRenderer.send('widget:ignore', Boolean(ignore)),
    move: (x, y) => ipcRenderer.send('widget:move', x, y),
    dragEnd: () => ipcRenderer.send('widget:drag-end'),
    setCompact: (compact) => ipcRenderer.send('widget:compact', Boolean(compact)),
  },
});
