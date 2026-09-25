const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function deriveMjpegUrl(serverUrl) {
  try {
    const url = new URL(serverUrl);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (url.protocol !== "http:" || !LOOPBACK_HOSTS.has(host)) return null;

    url.port = "9100";
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
