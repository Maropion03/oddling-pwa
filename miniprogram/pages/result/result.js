const api = require("../../utils/api");
const store = require("../../utils/store");

Page({
  data: { state: null, entry: null, token: "", sharing: false, error: "", format: "portrait", saving: false },
  async onLoad() {
    try {
      let state = getApp().globalData.state || await store.loadState();
      let entry = getApp().globalData.lastEntry || state.entries.find((item) => item.date === api.localDate());
      if (!entry) return wx.navigateBack();
      this.setData({ state, entry });
    } catch (error) { this.setData({ error: error.message || "读取存档失败" }); }
  },
  async prepareShare() {
    if (this.data.token || this.data.sharing) return;
    try {
      this.setData({ sharing: true, error: "" });
      const body = await api.request({ path: "/api/shares", method: "POST", data: {} });
      this.setData({ token: body.token });
    } catch (error) { this.setData({ error: error.message || "创建分享失败" }); }
    finally { this.setData({ sharing: false }); }
  },
  onShareAppMessage() {
    const { state, token } = this.data;
    return { title: `${state.avatar.name} 今天又长歪了一点`, path: `/pages/share/share?token=${token}`, imageUrl: "/assets/oddling-miniprogram-avatar.png" };
  },
  chooseFormat(event) { this.setData({ format: event.currentTarget.dataset.format }); },
  savePoster() {
    if (this.data.saving) return;
    this.setData({ saving: true, error: "" });
    const square = this.data.format === "square";
    const width = square ? 960 : 900;
    const height = square ? 960 : 1200;
    const query = wx.createSelectorQuery().in(this);
    query.select("#poster").fields({ node: true, size: true }).exec((result) => {
      const canvas = result[0] && result[0].node;
      if (!canvas) return this.setData({ saving: false, error: "海报画布初始化失败" });
      const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      const { state, entry } = this.data;
      const bodyColor = { coral: "#FF6F59", blue: "#2B59C3", yellow: "#F3CB42", green: "#D2FF45", violet: "#A984E8" }[state.avatar.parts.color || "coral"];
      ctx.fillStyle = "#F3EEDC"; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "#202124"; ctx.lineWidth = 8;
      ctx.fillStyle = "#2B59C3"; ctx.font = "bold 28px monospace"; ctx.fillText("READY TO POST", 64, 74);
      ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.ellipse(width / 2, square ? 350 : 410, 210, 190, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#202124"; ctx.beginPath(); ctx.arc(width / 2 - 72, square ? 330 : 390, 20, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(width / 2 + 72, square ? 330 : 390, 20, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(width / 2, square ? 398 : 458, 62, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.fillStyle = "#202124"; ctx.font = "900 54px sans-serif"; ctx.fillText(state.avatar.name, 64, square ? 610 : 720);
      ctx.fillStyle = "#55564F"; ctx.font = "32px sans-serif"; this.drawLines(ctx, entry.question, 64, square ? 672 : 782, width - 128, 46, 2); this.drawLines(ctx, `“${entry.answer}”`, 64, square ? 775 : 900, width - 128, 46, 2);
      ctx.fillStyle = "#F3CB42"; ctx.fillRect(64, height - 154, width - 128, 82); ctx.strokeStyle = "#202124"; ctx.lineWidth = 5; ctx.strokeRect(64, height - 154, width - 128, 82); ctx.fillStyle = "#202124"; ctx.font = "900 30px sans-serif"; ctx.fillText(`${entry.sticker.title} · ${entry.mutation.label}`, 88, height - 102);
      canvas.toTempFilePath({ fileType: "png", quality: 1, success: ({ tempFilePath }) => {
        wx.saveImageToPhotosAlbum({ filePath: tempFilePath, success: () => this.setData({ saving: false }), fail: () => {
          wx.showModal({ title: "需要相册权限", content: "允许后才能保存发布卡片。", confirmText: "去设置", success: (choice) => { if (choice.confirm) wx.openSetting({}); } });
          this.setData({ saving: false });
        } });
      }, fail: () => this.setData({ saving: false, error: "生成海报失败" }) });
    });
  },
  drawLines(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    let line = ""; let lineIndex = 0;
    for (const character of text) {
      const next = line + character;
      if (ctx.measureText(next).width > maxWidth && line) { ctx.fillText(line, x, y + lineIndex * lineHeight); line = character; lineIndex += 1; if (lineIndex >= maxLines) return; } else line = next;
    }
    if (lineIndex < maxLines) ctx.fillText(line, x, y + lineIndex * lineHeight);
  },
  goBack() { wx.navigateBack(); },
});
