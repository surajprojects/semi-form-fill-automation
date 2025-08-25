import { chromium } from "playwright";
import fs from "fs";

async function saveLogin() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("url_here");

    console.log("👉 Login manually, then press Enter...");
    await new Promise<void>((resolve) => process.stdin.once("data", () => resolve()));

    await context.storageState({ path: "auth.json" });
    await browser.close();
}

async function run() {
    const ids = fs.readFileSync("ids.txt", "utf-8")
        .split(/\r?\n|,/)
        .map(id => id.trim())
        .filter(Boolean);

    if (ids.length === 0) {
        console.log("No IDs left!");
        return;
    }

    // Launch browser fullscreen
    const browser = await chromium.launch({
        headless: false,
        args: ["--start-maximized"],
    });

    const context = await browser.newContext({
        storageState: "auth.json", // reuse login
        viewport: null,
    });

    let currentIndex = 0;

    async function openNextId() {
        if (currentIndex >= ids.length) {
            console.log("All IDs processed ✅");
            await browser.close();
            return;
        }

        const id = ids[currentIndex++];
        const page = await context.newPage();

        await page.goto("url_here" + id);

        // wait for site to load
        await page.waitForLoadState("networkidle");

        await page.waitForSelector("#ReasonForTesting");
        await page.selectOption("#ReasonForTesting", "Diagnosis of TB");

        await page.waitForSelector("#TypeOfCase");
        await page.selectOption("#TypeOfCase", "New");

        await page.waitForSelector(".custom-checkbox");
        await page.check('input.custom-checkbox[value="Presumptive"]');

        await page.waitForSelector(".custom-checkbox");
        await page.check('input.custom-checkbox[value="Smear -ve & Chest X Ray suggestive of TB"]');

        await page.waitForSelector("#TestType");
        await page.selectOption("#TestType", "Chest X Ray");

        await page.check('input[type="radio"][name="ResultAvailability"][value="Present"]');

        await page.waitForSelector("#FinalInterpretation");
        await page.selectOption("#FinalInterpretation", "Not Suggestive of TB");

        console.log(`Opened ID: ${id}`);

        // When you close this tab manually, open next
        page.on("close", () => {
            // Remove the processed ID from the list
            const remaining = ids.slice(currentIndex); // all unprocessed IDs
            fs.writeFileSync("ids.txt", remaining.join("\n"));

            // Add processed ID to done file
            fs.appendFileSync("ids_done.txt", id + "\n");
            console.log(`✅ ID ${id} moved to ids_done.txt`);

            // Continue with next ID
            openNextId();
        });
    }

    await openNextId();
}

run();