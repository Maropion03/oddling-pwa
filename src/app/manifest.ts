import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oddling 怪可爱分身",
    short_name: "Oddling",
    description: "每天回答一个怪问题 看看另一个你又长成了什么奇怪样子",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EEDC",
    theme_color: "#FF6F59",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
