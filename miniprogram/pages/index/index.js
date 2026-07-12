const WEB_APP_URL = "https://oddling-pwa.vercel.app";

Page({
  data: {
    webviewUrl: "",
  },

  onLoad() {
    const app = getApp();
    if (app.globalData.webviewUrl) {
      this.setData({ webviewUrl: app.globalData.webviewUrl });
      return;
    }

    wx.login({
      success: (res) => {
        if (res.code) {
          const url = `${WEB_APP_URL}/?wxcode=${encodeURIComponent(res.code)}`;
          app.globalData.webviewUrl = url;
          this.setData({ webviewUrl: url });
        } else {
          this.setData({ webviewUrl: WEB_APP_URL });
        }
      },
      fail: () => {
        this.setData({ webviewUrl: WEB_APP_URL });
      },
    });
  },

  onMessage(event) {
    const { data } = event.detail;
    if (!Array.isArray(data)) return;
    for (const item of data) {
      if (item.action === "share") {
        wx.showShareMenu({ withShareTicket: true });
      }
    }
  },

  onShareAppMessage() {
    return {
      title: "Oddling 怪可爱分身",
      path: "/pages/index/index",
    };
  },
});
