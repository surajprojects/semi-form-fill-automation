import { chromium } from "playwright";
import fs from "fs";

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

        await page.goto("url_here" + id, { waitUntil: "domcontentloaded" });

        const card = page.locator(".card");
        const locationText = await card.locator('div:has-text("Location(TU):") span').innerText();

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

        if (locationText === "Sheopur DTC") {
            await page.fill('input[placeholder="Select Testing Lab"]', "DH Sheopur");
            await page.waitForSelector('.vs__dropdown-menu li:not(.vs__no-options)');
            await page.locator('.vs__dropdown-menu li:not(.vs__no-options)').first().click();
        }
        else if (locationText === "TU KARAHAL") {
            await page.fill('input[placeholder="Select Testing Lab"]', "TU KARHAL");
            await page.waitForSelector('.vs__dropdown-menu li:not(.vs__no-options)');
            await page.locator('.vs__dropdown-menu li:not(.vs__no-options)').first().click();
        }
        else if (locationText === "TU VIJAYPUR") {
            await page.fill('input[placeholder="Select Testing Lab"]', "CHC Vijaypur");
            await page.waitForSelector('.vs__dropdown-menu li:not(.vs__no-options)');
            await page.locator('.vs__dropdown-menu li:not(.vs__no-options)').first().click();
        }
        else if (locationText === "TU BARODA") {
            await page.fill('input[placeholder="Select Testing Lab"]', "CHC Baroda");
            await page.waitForSelector('.vs__dropdown-menu li:not(.vs__no-options)');
            await page.locator('.vs__dropdown-menu li:not(.vs__no-options)').first().click();
        }

        await page.waitForSelector("#ResultDateReported");
        await page.click("#ResultDateReported");

        console.log(`Opened ID: ${id}`);

        try {
            const toast = await page.waitForSelector(".toast-message", {
                timeout: 60000, // wait up to 60s
            });

            const toastText = await toast.innerText();

            if (toastText.includes("Saved successfully!")) {
                console.log("✅ Form saved successfully!");

                await Promise.all([
                    page.waitForURL(/\/Dashboard\/Patient\/\d+/, { waitUntil: "domcontentloaded" }),
                    page.click("ol.breadcrumb li.active a"),
                ]);

                await page.waitForTimeout(800);
                await page.waitForSelector("#basicDetailsTab");

                await page.waitForSelector("#closeCaseTab");

                await page.waitForTimeout(1200);
                await page.click("#closeCaseTab");
            }
        } catch {
            console.log("⚠️ No toast appeared!");
        }

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
};

run();