const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("iphoneDesk", {
  connect: (config) => ipcRenderer.invoke("wda:connect", config),
  disconnect: () => ipcRenderer.invoke("wda:disconnect"),
  screenshot: () => ipcRenderer.invoke("wda:screenshot"),
  tap: (point) => ipcRenderer.invoke("wda:tap", point),
  drag: (gesture) => ipcRenderer.invoke("wda:drag", gesture),
  sendKeys: (text) => ipcRenderer.invoke("wda:keys", text),
  home: () => ipcRenderer.invoke("wda:home"),
  lock: () => ipcRenderer.invoke("wda:lock"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  toggleFullscreen: () => ipcRenderer.invoke("window:toggle-fullscreen"),
  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
});
