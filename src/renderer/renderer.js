import { containedImageRect, mapPointerToDevice } from "../geometry.js";

const $ = (id) => document.getElementById(id);
const ui = {
  connectButton: $("connectButton"), connectButtonLabel: $("connectButtonLabel"), serverUrl: $("serverUrl"),
  connectionPill: $("connectionPill"), connectionLabel: $("connectionLabel"), connectionHint: $("connectionHint"),
  deviceFrame: $("deviceFrame"), screenSurface: $("screenSurface"), deviceImage: $("deviceImage"), demoScreen: $("demoScreen"),
  screenMessage: $("screenMessage"), gestureIndicator: $("gestureIndicator"), homeButton: $("homeButton"),
  refreshButton: $("refreshButton"), keyboardButton: $("keyboardButton"), lockButton: $("lockButton"),
  keyboardCard: $("keyboardCard"), keyboardInput: $("keyboardInput"), sendKeysButton: $("sendKeysButton"),
  closeKeyboard: $("closeKeyboard"), pinButton: $("pinButton"), fullscreenButton: $("fullscreenButton"),
  guideButton: $("guideButton"), resolutionValue: $("resolutionValue"), fpsValue: $("fpsValue"),
  footerDot: $("footerDot"), footerStatus: $("footerStatus"), toast: $("toast"),
  directMode: $("directMode"), appiumMode: $("appiumMode"), appiumFields: $("appiumFields"),
  deviceUdid: $("deviceUdid"), platformVersion: $("platformVersion"), wdaBundleId: $("wdaBundleId"),
};

let connected = false;
let busy = false;
let polling = false;
let refreshRequested = false;
let deviceSize = { width: 390, height: 844 };
let pointerStart = null;
let frameTimes = [];
let toastTimer;
let connectionMode = "direct";

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.classList.toggle("is-error", isError);
  ui.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 3200);
}

function setBusy(value, label = "Đang kết nối…") {
  busy = value;
  ui.connectButton.disabled = value;
  ui.connectionPill.classList.toggle("is-busy", value);
  if (value) {
    ui.connectionLabel.textContent = label;
    ui.connectButtonLabel.textContent = label;
  }
}

function setConnected(value) {
  connected = value;
  ui.connectionPill.classList.toggle("is-online", value);
  ui.connectionPill.classList.toggle("is-offline", !value);
  ui.footerDot.classList.toggle("is-online", value);
  ui.deviceFrame.classList.toggle("is-live", value);
  ui.connectButton.classList.toggle("is-disconnect", value);
  ui.connectButtonLabel.textContent = value ? "Ngắt kết nối" : "Kết nối iPhone";
  ui.connectionLabel.textContent = value ? "Đã kết nối" : "Chưa kết nối";
  ui.footerStatus.textContent = value ? "Đang điều khiển qua WebDriverAgent" : "Ứng dụng đang ở chế độ xem trước";
  ui.connectionHint.textContent = value
    ? "Click, kéo hoặc cuộn trực tiếp trên màn hình iPhone."
    : "Ứng dụng chỉ kết nối trong mạng cục bộ. Không gửi dữ liệu lên Internet.";
  [ui.homeButton, ui.refreshButton, ui.keyboardButton, ui.lockButton].forEach((button) => { button.disabled = !value; });
  if (!value) {
    ui.deviceImage.removeAttribute("src");
    ui.resolutionValue.textContent = "—";
    ui.fpsValue.textContent = "Demo";
    ui.keyboardCard.classList.add("is-hidden");
    frameTimes = [];
  }
}

async function disconnect() {
  polling = false;
  await window.iphoneDesk.disconnect();
  setConnected(false);
}

async function connect() {
  if (busy) return;
  if (connected) {
    setBusy(true, "Đang ngắt…");
    await disconnect();
    setBusy(false);
    return;
  }

  setBusy(true);
  const response = await window.iphoneDesk.connect({
    url: ui.serverUrl.value,
    mode: connectionMode,
    udid: ui.deviceUdid.value,
    platformVersion: ui.platformVersion.value,
    bundleId: ui.wdaBundleId.value,
  });
  setBusy(false);
  if (!response.ok) {
    setConnected(false);
    showToast(response.error, true);
    ui.connectionHint.textContent = "Không tìm thấy WDA. Kiểm tra cáp USB, port forwarding và cổng 8100.";
    return;
  }

  deviceSize = response.value.deviceSize;
  ui.deviceFrame.style.aspectRatio = `${deviceSize.width} / ${deviceSize.height}`;
  ui.resolutionValue.textContent = `${deviceSize.width} × ${deviceSize.height}`;
  setConnected(true);
  showToast("Đã kết nối iPhone");
  polling = true;
  pollScreenshot();
}

async function pollScreenshot() {
  if (!polling || !connected) return;
  const response = await window.iphoneDesk.screenshot();
  if (!polling) return;
  if (!response.ok) {
    showToast(response.error, true);
    await disconnect();
    return;
  }

  ui.deviceImage.src = response.value.image;
  frameTimes.push(performance.now());
  frameTimes = frameTimes.filter((time) => performance.now() - time < 3000);
  const fps = frameTimes.length > 1 ? ((frameTimes.length - 1) * 1000) / (frameTimes.at(-1) - frameTimes[0]) : 0;
  ui.fpsValue.textContent = fps ? `${fps.toFixed(1)} FPS` : "Đang nhận";
  const delay = refreshRequested ? 0 : 180;
  refreshRequested = false;
  setTimeout(pollScreenshot, delay);
}

function pointerToDevice(event) {
  const bounds = ui.screenSurface.getBoundingClientRect();
  const imageRect = containedImageRect(bounds.width, bounds.height, deviceSize.width, deviceSize.height);
  return mapPointerToDevice(event.clientX - bounds.left, event.clientY - bounds.top, imageRect, deviceSize.width, deviceSize.height);
}

function flashGesture(event) {
  const bounds = ui.screenSurface.getBoundingClientRect();
  ui.gestureIndicator.style.left = `${event.clientX - bounds.left}px`;
  ui.gestureIndicator.style.top = `${event.clientY - bounds.top}px`;
  ui.gestureIndicator.classList.remove("is-visible");
  requestAnimationFrame(() => ui.gestureIndicator.classList.add("is-visible"));
}

ui.connectButton.addEventListener("click", connect);
function selectMode(mode) {
  connectionMode = mode;
  const appium = mode === "appium";
  ui.directMode.classList.toggle("is-active", !appium);
  ui.appiumMode.classList.toggle("is-active", appium);
  ui.directMode.setAttribute("aria-checked", String(!appium));
  ui.appiumMode.setAttribute("aria-checked", String(appium));
  ui.appiumFields.classList.toggle("is-hidden", !appium);
  ui.serverUrl.value = appium ? "http://127.0.0.1:4723" : "http://127.0.0.1:8100";
}
ui.directMode.addEventListener("click", () => selectMode("direct"));
ui.appiumMode.addEventListener("click", () => selectMode("appium"));
ui.refreshButton.addEventListener("click", () => { refreshRequested = true; showToast("Đang làm mới màn hình"); });
ui.homeButton.addEventListener("click", async () => {
  const response = await window.iphoneDesk.home();
  if (!response.ok) showToast(response.error, true);
});
ui.lockButton.addEventListener("click", async () => {
  const response = await window.iphoneDesk.lock();
  if (!response.ok) showToast(response.error, true); else showToast("Đã gửi lệnh khóa iPhone");
});

ui.keyboardButton.addEventListener("click", () => {
  ui.keyboardCard.classList.remove("is-hidden");
  ui.keyboardInput.focus();
});
ui.closeKeyboard.addEventListener("click", () => ui.keyboardCard.classList.add("is-hidden"));
ui.sendKeysButton.addEventListener("click", async () => {
  if (!ui.keyboardInput.value) return;
  const response = await window.iphoneDesk.sendKeys(ui.keyboardInput.value);
  if (!response.ok) showToast(response.error, true);
  else { showToast("Đã gửi nội dung"); ui.keyboardInput.value = ""; }
});

ui.screenSurface.addEventListener("pointerdown", (event) => {
  if (!connected || event.button !== 0) return;
  const point = pointerToDevice(event);
  if (!point) return;
  pointerStart = { point, time: performance.now(), id: event.pointerId };
  ui.screenSurface.setPointerCapture(event.pointerId);
});

ui.screenSurface.addEventListener("pointerup", async (event) => {
  if (!connected || !pointerStart || pointerStart.id !== event.pointerId) return;
  const start = pointerStart;
  pointerStart = null;
  const end = pointerToDevice(event) ?? start.point;
  const distance = Math.hypot(end.x - start.point.x, end.y - start.point.y);
  const duration = Math.max(.08, (performance.now() - start.time) / 1000);
  flashGesture(event);
  const response = distance < 8 && duration < .55
    ? await window.iphoneDesk.tap(end)
    : await window.iphoneDesk.drag({ from: start.point, to: end, duration });
  if (!response.ok) showToast(response.error, true);
});

ui.screenSurface.addEventListener("pointercancel", () => { pointerStart = null; });
ui.screenSurface.addEventListener("wheel", async (event) => {
  if (!connected) return;
  event.preventDefault();
  const x = Math.round(deviceSize.width / 2);
  const direction = Math.sign(event.deltaY) || 1;
  const from = { x, y: Math.round(deviceSize.height * (direction > 0 ? .68 : .34)) };
  const to = { x, y: Math.round(deviceSize.height * (direction > 0 ? .34 : .68)) };
  const response = await window.iphoneDesk.drag({ from, to, duration: .22 });
  if (!response.ok) showToast(response.error, true);
}, { passive: false });

ui.pinButton.addEventListener("click", async () => {
  const response = await window.iphoneDesk.toggleAlwaysOnTop();
  if (response.ok) ui.pinButton.classList.toggle("is-active", response.value);
});
ui.fullscreenButton.addEventListener("click", () => window.iphoneDesk.toggleFullscreen());
ui.guideButton.addEventListener("click", () => window.iphoneDesk.openExternal("https://appium.github.io/appium-xcuitest-driver/latest/guides/non-macos-hosts/"));

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "k" && connected) {
    event.preventDefault();
    ui.keyboardCard.classList.remove("is-hidden");
    ui.keyboardInput.focus();
  }
});

setConnected(false);
