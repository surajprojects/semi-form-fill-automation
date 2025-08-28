import { chromium } from "playwright";

async function saveLogin() {
    const browser = await chromium.launch({ headless: false, args: ["--start-maximized"], });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    await page.goto("url_here");

    console.log("👉 Login manually, then press Enter in terminal...");
    await new Promise<void>((resolve) => {
        process.stdin.once("data", () => {
            process.stdin.pause();
            resolve();
        });
    });

    try {
        await context.storageState({ path: "auth.json" });
        await browser.close();
    } catch (err) {
        console.log("⚠️ Browser was closed before saving auth:", err);
    }
};

saveLogin();