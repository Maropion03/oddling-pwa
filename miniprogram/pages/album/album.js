const store = require("../../utils/store");

Page({
  data: { state: null, tab: "mutations", items: [] },
  async onShow() {
    try { const state = await store.loadState(); this.setData({ state }); this.selectTab({ currentTarget: { dataset: { tab: this.data.tab } } }); }
    catch (error) { wx.showToast({ title: error.message || "加载失败", icon: "none" }); }
  },
  selectTab(event) {
    const tab = event.currentTarget.dataset.tab;
    const state = this.data.state;
    if (!state) return;
    const items = tab === "mutations" ? state.mutations : tab === "stickers" ? state.stickers.filter((item) => item.kind === "daily") : state.stickers.filter((item) => item.kind === "relationship");
    this.setData({ tab, items });
  },
});
