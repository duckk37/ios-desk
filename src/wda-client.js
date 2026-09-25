const DEFAULT_TIMEOUT_MS = 8_000;

export class WdaError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "WdaError";
    this.status = details.status;
    this.endpoint = details.endpoint;
    this.cause = details.cause;
  }
}

export function normalizeServerUrl(input) {
  const value = String(input ?? "").trim();
  if (!value) throw new WdaError("Hãy nhập địa chỉ WebDriverAgent.");

  let url;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new WdaError("Địa chỉ WebDriverAgent không hợp lệ.", { cause });
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new WdaError("Chỉ hỗ trợ địa chỉ HTTP hoặc HTTPS.");
  }
  if (url.username || url.password) {
    throw new WdaError("Không đặt tài khoản hoặc mật khẩu trong URL.");
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const parts = host.split(".").map(Number);
  const privateHost = host === "localhost" || host === "::1" || host.endsWith(".local")
    || host.startsWith("fe80:") || host.startsWith("fd") || host.startsWith("fc")
    || (parts.length === 4 && parts.every(Number.isInteger) && (
      parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254)
      || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    ));
  if (!privateHost) {
    throw new WdaError("Vì an toàn, chỉ được kết nối WDA/Appium trong máy hoặc mạng nội bộ.");
  }

  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

function valueOf(payload) {
  return payload && Object.hasOwn(payload, "value") ? payload.value : payload;
}

export class WdaClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = normalizeServerUrl(baseUrl);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.sessionId = null;
    if (typeof this.fetchImpl !== "function") throw new TypeError("fetch is required");
  }

  async request(path, options = {}) {
    const endpoint = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? this.timeoutMs);

    try {
      const response = await this.fetchImpl(endpoint, {
        method: options.method ?? "GET",
        headers: options.body === undefined ? undefined : { "content-type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const text = await response.text();
      let payload = null;
      if (text) {
        try { payload = JSON.parse(text); } catch { payload = text; }
      }
      if (!response.ok) {
        const detail = payload?.value?.message ?? payload?.message ?? text ?? response.statusText;
        throw new WdaError(`WDA ${response.status}: ${detail}`, { status: response.status, endpoint });
      }
      return payload;
    } catch (error) {
      if (error instanceof WdaError) throw error;
      const timedOut = error?.name === "AbortError";
      throw new WdaError(
        timedOut ? "WebDriverAgent không phản hồi kịp thời." : `Không kết nối được WebDriverAgent: ${error.message}`,
        { endpoint, cause: error },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async status() {
    const payload = await this.request("/status");
    return valueOf(payload) ?? {};
  }

  async createSession(capabilities = {}) {
    if (this.sessionId) return this.sessionId;
    const payload = await this.request("/session", {
      method: "POST",
      body: {
        capabilities: { alwaysMatch: capabilities, firstMatch: [{}] },
        desiredCapabilities: capabilities,
      },
    });
    const sessionId = payload?.sessionId ?? payload?.value?.sessionId;
    if (!sessionId) throw new WdaError("WDA đã phản hồi nhưng không tạo được phiên điều khiển.");
    this.sessionId = sessionId;
    return sessionId;
  }

  requireSession() {
    if (!this.sessionId) throw new WdaError("Chưa có phiên điều khiển WDA.");
    return this.sessionId;
  }

  async deleteSession() {
    if (!this.sessionId) return;
    const current = this.sessionId;
    this.sessionId = null;
    try {
      await this.request(`/session/${encodeURIComponent(current)}`, { method: "DELETE" });
    } catch {
      // The device may already be gone; local cleanup still succeeds.
    }
  }

  async windowSize() {
    const session = this.requireSession();
    const payload = await this.request(`/session/${encodeURIComponent(session)}/window/size`);
    const value = valueOf(payload);
    if (!Number.isFinite(value?.width) || !Number.isFinite(value?.height)) {
      throw new WdaError("WDA không trả về kích thước màn hình hợp lệ.");
    }
    return { width: value.width, height: value.height };
  }

  async updateSettings(settings) {
    const session = this.requireSession();
    return this.request(`/session/${encodeURIComponent(session)}/appium/settings`, {
      method: "POST",
      body: { settings },
    });
  }

  async screenshot() {
    const session = this.requireSession();
    const payload = await this.request(`/session/${encodeURIComponent(session)}/screenshot`, {
      timeoutMs: 15_000,
    });
    const base64 = valueOf(payload);
    if (typeof base64 !== "string" || base64.length < 20) {
      throw new WdaError("Ảnh màn hình WDA không hợp lệ.");
    }
    return `data:image/png;base64,${base64}`;
  }

  async tap(x, y) {
    const session = this.requireSession();
    const point = { x: Math.round(x), y: Math.round(y) };
    try {
      return await this.request(`/session/${encodeURIComponent(session)}/wda/tap/0`, {
        method: "POST", body: point,
      });
    } catch (error) {
      if (![404, 405, 501].includes(error.status)) throw error;
      return this.request(`/session/${encodeURIComponent(session)}/actions`, {
        method: "POST",
        body: { actions: [{ type: "pointer", id: "finger", parameters: { pointerType: "touch" }, actions: [
          { type: "pointerMove", duration: 0, origin: "viewport", ...point },
          { type: "pointerDown", button: 0 }, { type: "pause", duration: 80 }, { type: "pointerUp", button: 0 },
        ] }] },
      });
    }
  }

  async drag(from, to, duration = 0.25) {
    const session = this.requireSession();
    const normalizedDuration = Math.max(0.05, Math.min(5, duration));
    try {
      return await this.request(`/session/${encodeURIComponent(session)}/wda/dragfromtoforduration`, {
        method: "POST",
        body: {
          fromX: Math.round(from.x), fromY: Math.round(from.y),
          toX: Math.round(to.x), toY: Math.round(to.y), duration: normalizedDuration,
        },
      });
    } catch (error) {
      if (![404, 405, 501].includes(error.status)) throw error;
      return this.request(`/session/${encodeURIComponent(session)}/actions`, {
        method: "POST",
        body: { actions: [{ type: "pointer", id: "finger", parameters: { pointerType: "touch" }, actions: [
          { type: "pointerMove", duration: 0, origin: "viewport", x: Math.round(from.x), y: Math.round(from.y) },
          { type: "pointerDown", button: 0 },
          { type: "pointerMove", duration: Math.round(normalizedDuration * 1000), origin: "viewport", x: Math.round(to.x), y: Math.round(to.y) },
          { type: "pointerUp", button: 0 },
        ] }] },
      });
    }
  }

  async sendKeys(text) {
    const session = this.requireSession();
    return this.request(`/session/${encodeURIComponent(session)}/wda/keys`, {
      method: "POST",
      body: { value: [String(text)] },
    });
  }

  async home() {
    const session = this.requireSession();
    try {
      return await this.request(`/session/${encodeURIComponent(session)}/wda/homescreen`, { method: "POST", body: {} });
    } catch (error) {
      if (![404, 405, 501].includes(error.status)) throw error;
      return this.request(`/session/${encodeURIComponent(session)}/execute/sync`, {
        method: "POST", body: { script: "mobile: pressButton", args: [{ name: "home" }] },
      });
    }
  }

  async lock() {
    const session = this.requireSession();
    try {
      return await this.request("/wda/lock", { method: "POST", body: {} });
    } catch (error) {
      if (![404, 405, 501].includes(error.status)) throw error;
      return this.request(`/session/${encodeURIComponent(session)}/appium/device/lock`, { method: "POST", body: {} });
    }
  }
}
