const api = require("../../utils/api");
const store = require("../../utils/store");
const questions = require("../../data/onboarding");

Page({
  data: { step: 0, questions, choices: {}, freeText: "", phase: "questions", avatar: null, name: "", error: "" },
  choose(event) {
    const { questionId, optionId } = event.currentTarget.dataset;
    this.setData({ [`choices.${questionId}`]: optionId });
  },
  inputFreeText(event) { this.setData({ freeText: event.detail.value }); },
  inputName(event) { this.setData({ name: event.detail.value }); },
  previous() { this.setData({ step: Math.max(0, this.data.step - 1) }); },
  async next() {
    const { step, questions: all, choices, freeText } = this.data;
    if (step < 3 && !choices[all[step].id]) return;
    if (step === 3 && freeText.trim().length < 2) return;
    if (step < 3) return this.setData({ step: step + 1 });
    this.setData({ phase: "generating", error: "" });
    try {
      const body = await api.request({ path: "/api/avatar/create", method: "POST", data: {
        choices: all.map((question) => ({ questionId: question.id, optionId: choices[question.id] })), freeText,
      } });
      this.setData({ phase: "reveal", avatar: body.avatar, name: body.avatar.name });
    } catch (error) { this.setData({ phase: "questions", error: error.message || "生成失败" }); }
  },
  async enterHome() {
    try {
      const name = this.data.name.trim();
      if (name && name !== this.data.avatar.name) await api.request({ path: "/api/avatar/rename", method: "PATCH", data: { name } });
      await store.loadState();
      wx.switchTab({ url: "/pages/home/home" });
    } catch (error) { this.setData({ error: error.message || "保存失败" }); }
  },
});
