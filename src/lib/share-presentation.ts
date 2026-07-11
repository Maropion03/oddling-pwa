import type { PublicAvatarSnapshot } from "@/lib/domain/types";
import { plainText } from "@/lib/text";

export function sharePresentation(snapshot: PublicAvatarSnapshot) {
  const mutation = snapshot.sticker?.subtitle;
  const title = mutation ? `${snapshot.name} 长出了${plainText(mutation)}` : `${snapshot.name} 正在认真地长歪`;
  const description = mutation
    ? `${plainText(snapshot.publicLine)} 今天留下了${plainText(mutation)}`
    : `${plainText(snapshot.publicLine)} 来看看它会变成什么样`;
  return { title, description, mutation: plainText(mutation ?? "暂时没有新变化") };
}

export function ogAvatarDataUrl(snapshot: PublicAvatarSnapshot) {
  const color = {
    coral: "#FF6F59", blue: "#3772FF", yellow: "#FFD166", green: "#74B26A", violet: "#A984E8",
  }[snapshot.parts.color ?? "coral"];
  const body = {
    bean: "M76 50C111 20 176 30 194 81C214 136 192 207 130 218C75 228 32 185 39 126C43 91 51 70 76 50Z",
    pear: "M119 28C151 27 168 65 169 91C201 112 212 165 185 201C157 238 89 232 55 202C19 170 35 112 71 91C76 58 90 29 119 28Z",
    cloud: "M72 85C72 47 105 25 137 40C164 22 201 45 197 78C225 93 223 135 197 150C207 188 174 218 139 203C111 230 69 211 68 178C29 171 25 119 58 103C58 96 62 90 72 85Z",
    drop: "M124 24C124 24 199 105 197 158C195 211 157 229 120 227C75 224 42 199 45 155C49 105 124 24 124 24Z",
    pebble: "M57 67C82 35 153 27 186 58C219 90 217 178 178 207C139 236 69 219 43 184C18 151 29 103 57 67Z",
  }[snapshot.parts.body] ?? "M76 50C111 20 176 30 194 81C214 136 192 207 130 218C75 228 32 185 39 126C43 91 51 70 76 50Z";
  const eye = snapshot.parts.eyes === "wide"
    ? '<circle cx="96" cy="118" r="13"/><circle cx="158" cy="118" r="13"/>'
    : snapshot.parts.eyes === "line"
      ? '<path d="M84 118H108M146 118H170"/>'
      : '<circle cx="96" cy="118" r="7"/><circle cx="158" cy="118" r="7"/>';
  const mouth = snapshot.parts.mouth === "smile" ? '<path d="M111 157Q127 172 144 157"/>' : snapshot.parts.mouth === "o" ? '<circle cx="127" cy="160" r="9"/>' : '<path d="M113 160H142"/>';
  const texture = snapshot.parts.textures.includes("stars") ? '<path fill="#FFD166" d="M100 162L104 172L115 174L106 181L109 192L100 186L91 192L94 181L85 174L96 172Z"/>' : snapshot.parts.textures.includes("dots") ? '<circle cx="90" cy="177" r="5"/><circle cx="120" cy="188" r="4"/><circle cx="155" cy="172" r="3"/>' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><g fill="${color}" stroke="#202124" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="${body}"/>${texture}</g><g fill="#202124" stroke="#202124" stroke-width="5" stroke-linecap="round">${eye}${mouth}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
