const api = require("../../utils/api");
const store = require("../../utils/store");

Page({
  async onLoad() {
    try {
      await api.ensureSession();
      const state = await store.loadState();
      wx.reLaunch({ url: state.avatar ? "/pages/home/home" : "/pages/create/create" });
    } catch (error) {
      this.setData({ error: error.message || "登录失败" });
    }
  },
  data: { error: "" },
  retry() { wx.reLaunch({ url: "/pages/index/index" }); },
});
