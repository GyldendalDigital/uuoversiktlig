import { launch } from "puppeteer";
import { isSkolestudioPreview, logger } from "./utils.js";

const log = logger("PageSetup").log;

/**
 * @param {string} url
 */
export const loadPage = async (url) => {
  const browser = await launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  // Skolestudio specific: set secret cookie if preview endpoint to get access
  if (isSkolestudioPreview(url)) {
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

  return { browser, page };
};
