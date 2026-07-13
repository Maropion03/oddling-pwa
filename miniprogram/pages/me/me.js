const api = require("../../utils/api");
const store = require("../../utils/store");

Page({
  data: { state: null, name: "", saving: false, message: "" },
  async onShow() {
    try {
      const state = await store.loadState();
      this.setData({ state, name: state.avatar ? state.avatar.name : "" });
    } catch (error) { this.setData({ message: error.message || "加载失败" }); }
  },
  inputName(event) { this.setData({ name: event.detail.value }); },
  async saveName() {
    const name = this.data.name.trim();
    if (!name || this.data.saving) return;
    try {
      this.setData({ saving: true, message: "" });
      await api.request({ path: "/api/avatar/rename", method: "PATCH", data: { name } });
      await this.onShow();
      this.setData({ message: "名字已更新" });
    } catch (error) { this.setData({ message: error.message || "保存失败" }); }
    finally { this.setData({ saving: false }); }
  },
  async exportData() {
    try {
      const body = await api.request({ path: "/api/account/export" });
      const json = JSON.stringify(body, null, 2);
      const filePath = `${wx.env.USER_DATA_PATH}/oddling-export-${api.localDate()}.json`;
      await new Promise((resolve, reject) => wx.getFileSystemManager().writeFile({ filePath, data: json, encoding: "utf8", success: resolve, fail: reject }));
      if (typeof wx.shareFileMessage === "function") {
        wx.shareFileMessage({ filePath, fileName: "oddling-export.json", success: () => this.setData({ message: "已打开文件分享" }), fail: () => this.setData({ message: "文件已生成，可在微信文件中查看" }) });
      } else {
        await new Promise((resolve, reject) => wx.setClipboardData({ data: json, success: resolve, fail: reject }));
        this.setData({ message: "当前微信版本不支持文件分享，JSON 已复制" });
      }
    } catch (error) { this.setData({ message: error.message || "导出失败" }); }
  },
  manageShare(event) {
    const token = event.currentTarget.dataset.token;
    wx.showActionSheet({ itemList: ["设为 7 天", "设为 30 天", "设为 90 天", "设为永久", "撤销分享"], success: async ({ tapIndex }) => {
      try {
        if (tapIndex === 4) await api.request({ path: `/api/shares/${encodeURIComponent(token)}`, method: "DELETE" });
        else await api.request({ path: `/api/shares/${encodeURIComponent(token)}`, method: "PATCH", data: { expiresInDays: [7, 30, 90, null][tapIndex] } });
        await this.onShow();
        this.setData({ message: tapIndex === 4 ? "分享已撤销" : "分享有效期已更新" });
      } catch (error) { this.setData({ message: error.message || "更新分享失败" }); }
    } });
  },
  deleteAccount() {
    wx.showModal({ title: "删除所有数据？", content: "角色、回答、贴纸和分享记录无法恢复。", confirmText: "删除", confirmColor: "#B62E24", success: async (result) => {
      if (!result.confirm) return;
      try {
        await api.request({ path: "/api/account", method: "DELETE" });
        api.clearSession();
        getApp().globalData.state = null;
        wx.reLaunch({ url: "/pages/index/index" });
      } catch (error) { this.setData({ message: error.message || "删除失败" }); }
    } });
  },
});
