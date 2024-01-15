import { launch } from "puppeteer";
import { logger } from "./utils.js";
import { runLighthouseTest } from "./lighthouseTest.js";
import { runActivityDataTest } from "./activityDataTest.js";
import { runLanguageTest } from "./languageTest.js";
import { runHeadingTest } from "./headingTests.js";
import { runRestTest } from "./restTest.js";

const log = logger("BrowserTest").log;

/**
 * @param {string} url
 */
const runBrowserTest = async (url) => {
  const start = Date.now();

  /// PAGE SETUP
  const browser = await launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Skolestudio specific: set secret cookie if preview endpoint to get access
    if (url.includes("/preview-content/")) {
      log("setting secret cookie");
      await page.setCookie({
        name: "PreviewContentCookieSecret",
        value: process.env.PREVIEW_COOKIE_SECRET,
        domain: new URL(url).hostname,
        path: "/",
      });
    }

    log("ping url");

    const ping = await page.goto(url, { waitUntil: "networkidle0" });
    const status = ping.status();
    if (status < 200 || status >= 400) {
      throw new Error(ping.statusText() || `Ping failed with status ${status}`);
    } else {
      log("ping", status);
    }

    const lighthouseResult = await runLighthouseTest(url, page);

    const activity = await runActivityDataTest(page);

    const languageTest = await runLanguageTest(page, activity?.subjects ?? []);

    const headingTest = await runHeadingTest(page);

    const restTest = await runRestTest(page);

    const title = await page.title();

    return {
      title,
      elapsedMs: Date.now() - start,
      url,

      activity,
      ...lighthouseResult,
      ...languageTest,
      ...headingTest,
      ...restTest,
    };
  } catch (error) {
    log("caught error", error.message);
    throw error;
  } finally {
    log("cleaning up");
    await page.close();
    log("page", page.isClosed());
    await browser.close();
    log("browser", !browser.connected);
  }
};

export { runBrowserTest };
