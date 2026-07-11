import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function createOddling(page: import("@playwright/test").Page, enterNest = true) {
  await page.goto("/");
  await page.getByRole("link", { name: "开始生成" }).click();
  await page.getByRole("heading", { name: "突然下起会说话的雨你躲进哪里" }).waitFor();
  await page.getByRole("button", { name: "雨里最亮的水坑 干脆加入它 C" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("heading", { name: "收到一段来自未来的杂音你先做什么" }).waitFor();
  await page.getByRole("button", { name: "立刻回一段更怪的 不能让它冷场 B" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("heading", { name: "陌生生物送你一件礼物你想要哪件" }).waitFor();
  await page.getByRole("button", { name: "每天换名字的种子 看看它想成为什么 C" }).click();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.getByRole("textbox", { name: "你的回答" }).fill("把今天没说完的勇气折成一只纸船");
  await page.getByRole("button", { name: "开始生成" }).click();
  await expect(page.locator(".reveal-stage").getByText("SPECIMEN FOUND", { exact: true })).toBeVisible({ timeout: 6_000 });
  if (enterNest) {
    await page.getByRole("button", { name: "带它回巢穴" }).click();
    await expect(page).toHaveURL(/\/home$/);
  }
}

async function completeDaily(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "换一题" }).click();
  await expect(page.getByRole("button", { name: "已换题" })).toBeDisabled();
  await page.getByRole("textbox", { name: "今天的回答" }).fill("今天没有大事发生，但我记得抬头看了一次云");
  await page.getByRole("button", { name: "喂给它" }).click();
  await expect(page.getByText("TODAY IS ARCHIVED")).toBeVisible();
}

test("onboarding, daily mutation, persistence and album form one complete loop", async ({ page }) => {
  await createOddling(page);
  await completeDaily(page);
  await expect(page.getByText("新变异")).toBeVisible();
  await page.reload();
  await expect(page.getByText("TODAY IS ARCHIVED")).toBeVisible();
  await page.goto("/album");
  await expect(page.getByRole("tab", { name: "变异谱 1" })).toBeVisible();
  await page.getByRole("tab", { name: "每日贴纸 1" }).click();
  await expect(page.getByText("DAILY DROP")).toBeVisible();
});

test("public share is private, guest interaction is idempotent, and conversion CTA works", async ({ page }) => {
  await createOddling(page);
  await completeDaily(page);
  await page.getByRole("button", { name: "复制链接" }).click();
  const preview = page.getByRole("link", { name: "预览好友看到的页面" });
  await expect(preview).toBeVisible();
  const href = await preview.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.getByText("今天没有大事发生，但我记得抬头看了一次云")).toHaveCount(0);
  await page.getByRole("button", { name: "投喂怪东西 来源不明但大概能吃" }).click();
  const response = page.getByRole("heading", { level: 2 });
  const firstResponse = await response.textContent();
  await expect(page.getByText("RELATIONSHIP")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "戳一下 看看它会不会装没看见" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(firstResponse ?? "");
  await expect(page.getByRole("link", { name: "我也放一个出来" })).toHaveAttribute("href", "/create");
});

test("result cards can be saved and public links can be managed", async ({ page }) => {
  await createOddling(page, false);
  await expect(page.getByLabel("最突出的性格属性")).toBeVisible();
  await expect(page.locator(".result-share-card .avatar-body")).toHaveAttribute("fill", /^#/);
  const birthDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "保存图片" }).click();
  expect((await birthDownload).suggestedFilename()).toMatch(/^oddling-birth-portrait\.png$/);

  await page.getByRole("button", { name: /1:1/ }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole("button", { name: "翻页中" })).toBeDisabled();
  const saveButton = page.getByRole("button", { name: "保存图片" });
  await expect(saveButton).toBeEnabled({ timeout: 1_500 });
  const squareDownload = page.waitForEvent("download");
  await saveButton.click();
  expect((await squareDownload).suggestedFilename()).toMatch(/^oddling-birth-square\.png$/);

  await page.getByRole("button", { name: "带它回巢穴" }).click();
  await completeDaily(page);
  await page.getByRole("button", { name: "去保存" }).click();
  await expect(page.getByRole("button", { name: "保存图片" })).toBeVisible();
  const dailyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "保存图片" }).click();
  expect((await dailyDownload).suggestedFilename()).toMatch(/^oddling-daily-portrait\.png$/);

  await page.getByRole("button", { name: "返回" }).click();
  await page.getByRole("button", { name: "复制链接" }).click();
  await page.goto("/me");
  await expect(page.getByText("公开分享")).toBeVisible();
  await page.getByRole("combobox", { name: /分享有效期/ }).selectOption("90");
  await page.getByRole("button", { name: "撤销" }).click();
  await expect(page.getByText("还没有公开链接")).toBeVisible();
});

test("settings support rename, themes, export and guarded deletion", async ({ page }) => {
  await createOddling(page);
  await page.goto("/me");
  await page.getByRole("textbox", { name: "分身名字" }).fill("云吞");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("img", { name: "云吞 的怪可爱分身" })).toBeVisible();
  await page.getByRole("button", { name: "暗色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^oddling-export-.*\.json$/);
  await page.getByRole("button", { name: "删除" }).click();
  await expect(page.getByRole("button", { name: "确定删除" })).toBeVisible();
  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.getByRole("button", { name: "确定删除" })).toHaveCount(0);
});

test("PWA assets and offline shell are available", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const body = await manifest.json();
  expect(body.name).toContain("Oddling");
  expect(body.display).toBe("standalone");
  expect(body.icons).toHaveLength(3);
  expect((await request.get("/sw.js")).ok()).toBeTruthy();
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "信号被分身吃掉了" })).toBeVisible();
});

test("landing and create flow have no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".landing__copy")).toHaveCSS("opacity", "1");
  const landingResults = await new AxeBuilder({ page }).analyze();
  expect(landingResults.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
  await page.getByRole("link", { name: "开始生成" }).click();
  await expect(page.locator(".question-stage")).toHaveCSS("opacity", "1");
  const createResults = await new AxeBuilder({ page }).analyze();
  expect(createResults.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
});

test("mobile and desktop layouts do not overflow", async ({ page }, testInfo) => {
  const viewport = testInfo.project.name.includes("mobile") ? { width: 375, height: 812 } : { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await page.goto("/");
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  await expect(page.getByRole("link", { name: "开始生成" })).toBeVisible();
});
