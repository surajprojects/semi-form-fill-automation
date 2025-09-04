import { chromium } from "playwright";
import fs from "fs";

async function pickDate(page: any, inputSel: string, dateStr: string) {
    const [dd = 16, mm = 7, yyyy = 2025] = dateStr.split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const targetHeader = `${months[mm - 1]} ${yyyy}`;
    const widget = page.locator('.vdp-datepicker').filter({ has: page.locator(inputSel) });
    await page.click(inputSel);
    const dayCal = widget.locator(
        '.vdp-datepicker__calendar:not([style*="display: none"]):has(header .day__month_btn)'
    );
    await dayCal.waitFor();
    const calRoot = await dayCal.elementHandle();
    if (!calRoot) throw new Error('Calendar root not found');

    let guard = 240;
    while (guard-- > 0) {
        const headerLoc = dayCal.locator('header .day__month_btn');
        const header = (await headerLoc.innerText()).trim();
        if (header === targetHeader) break;

        const [curMonStr, curYearStr] = header.split(' ');
        const curIdx = months.indexOf(curMonStr);
        const curYear = parseInt(curYearStr, 10);

        const goPrev = curYear > yyyy || (curYear === yyyy && curIdx > (mm - 1));
        const prevText = header;

        if (goPrev) {
            await dayCal.locator('header .prev').click();
        } else {
            const nextBtn = dayCal.locator('header .next:not(.disabled)');
            if (await nextBtn.count() === 0) throw new Error('Next disabled; cannot move forward');
            await nextBtn.click();
        }

        await page.waitForFunction(
            (root: any, prev: any) => {
                const el = root.querySelector('header .day__month_btn');
                return !!el && el.textContent && el.textContent.trim() !== prev;
            },
            calRoot,
            prevText
        );
    }

    const finalHeader = (await dayCal.locator('header .day__month_btn').innerText()).trim();
    if (finalHeader !== targetHeader) {
        throw new Error(`Failed to reach target month: wanted "${targetHeader}", got "${finalHeader}"`);
    }

    await dayCal.locator(`.cell.day:not(.disabled):has-text("${dd}")`).click();
};

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

        const card = page.locator('.card');
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

        await page.waitForSelector("#ResultDateReported");
        await pickDate(page, "#ResultDateReported", "15-07-2025");

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
};

run();