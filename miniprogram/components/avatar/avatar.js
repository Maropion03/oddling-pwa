Component({
  properties: {
    parts: { type: Object, value: {} },
    name: { type: String, value: "Oddling" },
    size: { type: String, value: "large" },
  },
  data: {
    body: "bean",
    color: "coral",
    eyes: "dot",
    mouth: "line",
    head: "none",
    back: "none",
    texture: "dots",
    hasHandheld: false,
  },
  observers: {
    parts(parts) {
      const value = parts || {};
      this.setData({
        body: value.body || "bean",
        color: value.color || "coral",
        eyes: value.eyes || "dot",
        mouth: value.mouth || "line",
        head: value.head || "none",
        back: value.back || "none",
        texture: Array.isArray(value.textures) && value.textures.length ? value.textures.join(" ") : "dots",
        hasHandheld: Boolean(value.handheld),
      });
    },
  },
});
