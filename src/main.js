import { app, BrowserWindow, ipcMain, shell } from "electron";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WdaClient } from "./wda-client.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const smokePath = process.env.IPHONE_DESK_SMOKE_PATH;
if (smokePath) app.disableHardwareAcceleration();
let windowRef;
let client;
let deviceSize;

function result(value = null) {
  return { ok: true, value };
}

function failure(error) {
  return { ok: false, error: error?.message ?? String(error) };
}

async function invokeSafely(task) {
  try { return result(await task()); } catch (error) { return failure(error); }
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#090b12",
    title: "iPhone Desk",
    show: !smokePath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      offscreen: Boolean(smokePath),
      backgroundThrottling: false,
    },
  });
  windowRef.loadFile(path.join(currentDir, "renderer", "index.html"));
  if (smokePath) {
    windowRef.webContents.once("did-finish-load", async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 750));
        const image = await windowRef.webContents.capturePage();
        await writeFile(smokePath, image.toPNG());
        console.log(`Smoke screenshot: ${smokePath}`);
        app.exit(0);
      } catch (error) {
        console.error(error);
        app.exit(1);
      }
    });
  }
}

ipcMain.handle("wda:connect", (_event, config) => invokeSafely(async () => {
  client = new WdaClient(config?.url);
  const status = await client.status();
  const capabilities = config?.mode === "appium" ? {
    platformName: "iOS",
    "appium:automationName": "XCUITest",
    "appium:udid": String(config.udid ?? "").trim(),
    "appium:platformVersion": String(config.platformVersion ?? "").trim(),
    "appium:usePreinstalledWDA": true,
    "appium:updatedWDABundleId": String(config.bundleId ?? "").trim(),
    "appium:newCommandTimeout": 0,
  } : {};
  if (config?.mode === "appium" && (!capabilities["appium:udid"] || !capabilities["appium:platformVersion"] || !capabilities["appium:updatedWDABundleId"])) {
    throw new Error("Chế độ Appium cần UDID, phiên bản iOS và bundle ID của WDA.");
  }
  await client.createSession(capabilities);
  deviceSize = await client.windowSize();
  return { status, deviceSize, url: client.baseUrl };
}));

ipcMain.handle("wda:disconnect", () => invokeSafely(async () => {
  await client?.deleteSession();
  client = null;
  deviceSize = null;
}));

ipcMain.handle("wda:screenshot", () => invokeSafely(async () => ({
  image: await client.screenshot(),
  deviceSize,
})));

ipcMain.handle("wda:tap", (_event, point) => invokeSafely(() => client.tap(point.x, point.y)));
ipcMain.handle("wda:drag", (_event, gesture) => invokeSafely(() => client.drag(gesture.from, gesture.to, gesture.duration)));
ipcMain.handle("wda:keys", (_event, text) => invokeSafely(() => client.sendKeys(text)));
ipcMain.handle("wda:home", () => invokeSafely(() => client.home()));
ipcMain.handle("wda:lock", () => invokeSafely(() => client.lock()));

ipcMain.handle("window:toggle-always-on-top", () => {
  const next = !windowRef.isAlwaysOnTop();
  windowRef.setAlwaysOnTop(next, "floating");
  return result(next);
});

ipcMain.handle("window:toggle-fullscreen", () => {
  const next = !windowRef.isFullScreen();
  windowRef.setFullScreen(next);
  return result(next);
});

ipcMain.handle("app:open-external", async (_event, url) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") return failure(new Error("Chỉ mở liên kết HTTPS."));
  await shell.openExternal(parsed.toString());
  return result();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => client?.deleteSession());
app.on("window-all-closed", () => app.quit());
