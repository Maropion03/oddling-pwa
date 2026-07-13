const api = require("../../utils/api");

Page({
  data: { token: "", share: null, interaction: null, loading: true, busy: false, error: "", labelText: "", showLabel: false },
  async onLoad(query) {
    if (!query.token) return this.setData({ loading: false, error: "分享不存在" });
    this.setData({ token: query.token });
    await this.loadShare();
  },
  async loadShare() {
    try {
      const body = await api.request({ path: `/api/public/shares/${encodeURIComponent(this.data.token)}?visitorId=${encodeURIComponent(api.visitorId())}`, auth: false });
      this.setData({ share: body, interaction: body.interaction || null });
    } catch (error) { this.setData({ error: error.message || "分享不存在" }); }
    finally { this.setData({ loading: false }); }
  },
  chooseLabel() { if (!this.data.interaction) this.setData({ showLabel: true }); },
  inputLabel(event) { this.setData({ labelText: event.detail.value }); },
  cancelLabel() { this.setData({ showLabel: false, labelText: "" }); },
  async act(event) {
    const action = event.currentTarget.dataset.action;
    if (this.data.interaction || this.data.busy) return;
    if (action === "label" && !this.data.labelText.trim()) return this.chooseLabel();
    try {
      this.setData({ busy: true, error: "", showLabel: false });
      const body = await api.request({ path: `/api/public/shares/${encodeURIComponent(this.data.token)}/interact`, method: "POST", auth: false, data: { visitorId: api.visitorId(), action, labelText: action === "label" ? this.data.labelText.trim() : undefined } });
      this.setData({ interaction: body.interaction });
    } catch (error) { this.setData({ error: error.message || "互动失败" }); }
    finally { this.setData({ busy: false }); }
  },
  onShareAppMessage() { return { title: "来看看这只 Oddling", path: `/pages/share/share?token=${this.data.token}` }; },
});
