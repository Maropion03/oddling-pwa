import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const output = new URL("../public/icons/", import.meta.url);
await mkdir(output, { recursive: true });

function iconSvg(size, maskable = false) {
  const pad = maskable ? size * 0.19 : size * 0.08;
  const stroke = Math.max(8, size * 0.035);
  const bodyLeft = pad + size * 0.08;
  const bodyTop = pad + size * 0.14;
  const bodyWidth = size - bodyLeft * 2;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${maskable ? 0 : size * 0.18}" fill="#FF6F59"/>
    <circle cx="${size * 0.78}" cy="${size * 0.2}" r="${size * 0.12}" fill="#F3CB42" stroke="#202124" stroke-width="${stroke}"/>
    <path d="M${size * 0.51} ${bodyTop} C${bodyLeft} ${bodyTop * 0.72}, ${bodyLeft * 0.72} ${size * 0.46}, ${bodyLeft} ${size * 0.7} C${size * 0.31} ${size * 0.96}, ${size * 0.76} ${size * 0.94}, ${bodyLeft + bodyWidth} ${size * 0.67} C${size * 0.94} ${size * 0.42}, ${size * 0.77} ${bodyTop * 0.76}, ${size * 0.51} ${bodyTop}Z" fill="#F3EEDC" stroke="#202124" stroke-width="${stroke}" stroke-linejoin="round"/>
    <path d="M${size * 0.5} ${bodyTop} L${size * 0.56} ${size * 0.08}" fill="none" stroke="#202124" stroke-width="${stroke}" stroke-linecap="round"/>
    <path d="M${size * 0.55} ${size * 0.08} L${size * 0.7} ${size * 0.04} L${size * 0.65} ${size * 0.18}Z" fill="#2B59C3" stroke="#202124" stroke-width="${stroke}" stroke-linejoin="round"/>
    <circle cx="${size * 0.4}" cy="${size * 0.48}" r="${size * 0.045}" fill="#202124"/>
    <path d="M${size * 0.58} ${size * 0.43} Q${size * 0.66} ${size * 0.5} ${size * 0.73} ${size * 0.43} Q${size * 0.66} ${size * 0.59} ${size * 0.58} ${size * 0.43}Z" fill="#202124"/>
    <path d="M${size * 0.44} ${size * 0.65} Q${size * 0.54} ${size * 0.74} ${size * 0.66} ${size * 0.63}" fill="none" stroke="#202124" stroke-width="${stroke}" stroke-linecap="round"/>
    <path d="M${size * 0.27} ${size * 0.7} L${size * 0.34} ${size * 0.74} L${size * 0.3} ${size * 0.82} L${size * 0.23} ${size * 0.77}Z" fill="#D2FF45" stroke="#202124" stroke-width="${stroke * 0.7}"/>
  </svg>`;
}

for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
]) {
  await sharp(Buffer.from(iconSvg(size, maskable))).png().toFile(fileURLToPath(new URL(name, output)));
}

console.log("Generated Oddling PWA icons.");
