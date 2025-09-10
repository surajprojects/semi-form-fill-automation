import { chromium } from "playwright";

async function saveLogin() {
    const browser = await chromium.launch({ headless: false, args: ["--start-maximized"], });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    await page.goto("url_here");

    console.log("Login manually, Close the browser after logging in.");

    // When the page is closed, save storage state
    page.on("close", async () => {
        try {
            await context.storageState({ path: "auth.json" });
            console.log("Auth saved to auth.json");
        } catch (err) {
            console.error("Failed to save auth:", err);
        } finally {
            await browser.close();
        }
    });
};

saveLogin();