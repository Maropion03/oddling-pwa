const BASE_URL = "https://oddling-pwa.vercel.app";
const SESSION_KEY = "oddling:miniprogram:session:v1";

function rawRequest({ path, method = "GET", data, headers = {} }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header: { "Content-Type": "application/json", ...headers },
      success(response) {
        const body = response.data && typeof response.data === "object" ? response.data : {};
        if (response.statusCode >= 200 && response.statusCode < 300) return resolve(body);
        const error = new Error(body.error || "服务暂时开小差了");
        error.statusCode = response.statusCode;
        reject(error);
      },
      fail() { reject(new Error("网络连接失败 请稍后重试")); },
    });
  });
}

function getSession() { return wx.getStorageSync(SESSION_KEY) || null; }
function setSession(session) { wx.setStorageSync(SESSION_KEY, session); }
function clearSession() { wx.removeStorageSync(SESSION_KEY); }

function wxLogin() {
  return new Promise((resolve, reject) => wx.login({ success: resolve, fail: () => reject(new Error("无法获取微信登录凭证")) }));
}

async function login() {
  const result = await wxLogin();
  if (!result.code) throw new Error("微信登录凭证为空");
  const session = await rawRequest({ path: "/api/miniprogram/auth/login", method: "POST", data: { code: result.code } });
  setSession(session);
  return session;
}

async function refresh() {
  const current = getSession();
  if (!current || !current.refreshToken) return login();
  try {
    const session = await rawRequest({ path: "/api/miniprogram/auth/refresh", method: "POST", data: { refreshToken: current.refreshToken } });
    setSession(session);
    return session;
  } catch {
    clearSession();
    return login();
  }
}

async function ensureSession() {
  const current = getSession();
  if (!current || !current.accessToken) return login();
  return current;
}

async function request({ path, method = "GET", data, auth = true, retried = false }) {
  const session = auth ? await ensureSession() : null;
  try {
    return await rawRequest({
      path,
      method,
      data,
      headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
    });
  } catch (error) {
    if (auth && error.statusCode === 401 && !retried) {
      await refresh();
      return request({ path, method, data, auth, retried: true });
    }
    throw error;
  }
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function timezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai"; } catch { return "Asia/Shanghai"; }
}

function visitorId() {
  const key = "oddling:miniprogram:visitor:v1";
  let value = wx.getStorageSync(key);
  if (value) return value;
  value = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (letter) => {
    const random = Math.floor(Math.random() * 16);
    return (letter === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
  wx.setStorageSync(key, value);
  return value;
}

module.exports = { BASE_URL, request, ensureSession, clearSession, localDate, timezone, visitorId };
