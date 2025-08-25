import { chromium } from "playwright";

async function saveLogin() {
    const browser = await chromium.launch({ headless: false, args: ["--start-maximized"], });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("url_here");

    console.log("👉 Login manually, then press Enter...");
    await new Promise<void>((resolve) => process.stdin.once("data", () => resolve()));

    await context.storageState({ path: "auth.json" });
    await browser.close();
};

saveLogin();