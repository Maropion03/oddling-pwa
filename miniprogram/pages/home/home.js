const api = require("../../utils/api");
const store = require("../../utils/store");

Page({
  data: { state: null, question: null, answer: "", busy: false, error: "", today: "" },
  async onShow() {
    await this.refresh();
  },
  async refresh() {
    try {
      this.setData({ busy: true, error: "" });
      const [state, today] = await Promise.all([store.loadState(), store.loadToday()]);
      if (!state.avatar) return wx.redirectTo({ url: "/pages/create/create" });
      const date = api.localDate();
      const entry = state.entries.find((item) => item.date === date) || null;
      this.setData({ state, question: today.question, today: date, entry });
    } catch (error) { this.setData({ error: error.message || "加载失败" }); }
    finally { this.setData({ busy: false }); }
  },
  inputAnswer(event) { this.setData({ answer: event.detail.value }); },
  async reroll() {
    if (this.data.busy || !this.data.question) return;
    try {
      this.setData({ busy: true, error: "" });
      const body = await api.request({ path: "/api/daily/reroll", method: "POST", data: { date: this.data.today, timezone: api.timezone(), currentQuestionId: this.data.question.id } });
      this.setData({ question: body.question });
    } catch (error) { this.setData({ error: error.message || "换题失败" }); }
    finally { this.setData({ busy: false }); }
  },
  async submit() {
    const answer = this.data.answer.trim();
    if (!answer || this.data.busy || !this.data.question) return;
    try {
      this.setData({ busy: true, error: "" });
      await api.request({ path: "/api/daily/respond", method: "POST", data: { date: this.data.today, timezone: api.timezone(), questionId: this.data.question.id, answer } });
      const state = await store.loadState();
      const entry = state.entries.find((item) => item.date === this.data.today);
      getApp().globalData.lastEntry = entry;
      wx.navigateTo({ url: "/pages/result/result" });
    } catch (error) { this.setData({ error: error.message || "保存失败" }); }
    finally { this.setData({ busy: false }); }
  },
  openResult() { getApp().globalData.lastEntry = this.data.entry; wx.navigateTo({ url: "/pages/result/result" }); },
});
