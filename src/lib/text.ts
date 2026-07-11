const DISPLAY_PUNCTUATION = /[，。！？：；、…“”‘’（）《》〈〉·—–,.!?;:()[\]{}]/g;

export function plainText(value: string) {
  return value.replace(DISPLAY_PUNCTUATION, "").replace(/\s{2,}/g, " ").trim();
}

export function compactDate(value: string) {
  return value.replace(/[^0-9]/g, "");
}
