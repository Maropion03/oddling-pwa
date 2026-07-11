import { chromium } from "playwright";

const baseURL = process.env.ODDLING_BASE_URL ?? "https://oddling-pwa.vercel.app";
const browser = await chromium.launch({ headless: true });
const owner = await browser.newContext();
const guest = await browser.newContext();
const page = await owner.newPage();
let ownerCreated = false;

try {
  await page.goto(baseURL);
  await page.getByRole("link", { name: "开始生成" }).click();
  await page.getByRole("button", { name: "雨里最亮的水坑 干脆加入它 C" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("button", { name: "立刻回一段更怪的 不能让它冷场 B" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("button", { name: "每天换名字的种子 看看它想成为什么 C" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("textbox", { name: "你的回答" }).fill("生产测试产生的临时分身");
  await page.getByRole("button", { name: "开始生成" }).click();
  await page.getByText("SPECIMEN FOUND").waitFor({ timeout: 20_000 });
  ownerCreated = true;
  await page.getByRole("button", { name: "带它回巢穴" }).click();
  await page.waitForURL(/\/home$/);
  await page.getByText("已同步").waitFor({ timeout: 10_000 });

  await page.getByRole("button", { name: "换一题" }).click();
  await page.getByRole("button", { name: "已换题" }).waitFor({ timeout: 10_000 });
  await page.getByRole("textbox", { name: "今天的回答" }).fill("这条回答会在测试结束后自动删除");
  await page.getByRole("button", { name: "喂给它" }).click();
  await page.getByText("TODAY IS ARCHIVED").waitFor({ timeout: 20_000 });

  await page.getByRole("button", { name: "复制链接" }).click();
  const preview = page.getByRole("link", { name: "预览好友看到的页面 →" });
  await preview.waitFor({ timeout: 10_000 });
  const href = await preview.getAttribute("href");
  if (!href) throw new Error("Production share URL was not created");

  const guestPage = await guest.newPage();
  await guestPage.goto(new URL(href, baseURL).href);
  await guestPage.getByRole("button", { name: "投喂怪东西 来源不明，但大概能吃" }).click();
  await guestPage.getByText("RELATIONSHIP").waitFor({ timeout: 15_000 });
  const firstResponse = await guestPage.getByRole("heading", { level: 2 }).textContent();
  await guestPage.reload();
  await guestPage.getByText("RELATIONSHIP").waitFor({ timeout: 10_000 });
  const restoredResponse = await guestPage.getByRole("heading", { level: 2 }).textContent();
  if (firstResponse !== restoredResponse) throw new Error("Guest interaction was not restored after reload");

  console.log("Production verified: cloud create, daily mutation, share, guest interaction, and reload persistence.");
} finally {
  if (ownerCreated) await page.request.delete(`${baseURL}/api/account`).catch(() => undefined);
  await owner.close();
  await guest.close();
  await browser.close();
}
