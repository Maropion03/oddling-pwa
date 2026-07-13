const api = require("./api");

async function loadState() {
  const body = await api.request({ path: "/api/account/state" });
  const app = getApp();
  app.globalData.state = body.state;
  return body.state;
}

async function loadToday() {
  const body = await api.request({ path: `/api/daily?date=${encodeURIComponent(api.localDate())}&timezone=${encodeURIComponent(api.timezone())}` });
  getApp().globalData.todayQuestion = body.question || null;
  return body;
}

module.exports = { loadState, loadToday };
