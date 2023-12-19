import { launch } from "puppeteer";
import lighthouse from "lighthouse";
import {
  userAgents,
  screenEmulationMetrics,
} from "lighthouse/core/config/constants.js";

/** @type {import("lighthouse/types/config").default} */
const config = {
  extends: "lighthouse:default",
  settings: {
    output: "html",
    onlyCategories: ["accessibility"],
    formFactor: "desktop",
    screenEmulation: screenEmulationMetrics.desktop,
    emulatedUserAgent: userAgents.desktop,
    skipAudits: [
      "td-has-header",
      "table-fake-caption",
      "label-content-name-mismatch",
    ],
  },
};

/**
 *
 * @param {string} url
 * @returns {Promise<import("lighthouse").RunnerResult | undefined>}
 */
const runLighthouse = async (url) => {
  console.debug("Launching browser");

  const browser = await launch({
    headless: "new",
  });

  const page = await browser.newPage();

  console.debug("Running lighthouse", url);

  const result = await lighthouse(
    url,
    { disableStorageReset: true },
    config,
    page
  );

  console.debug("Lighthouse done", result.lhr.categories.accessibility.score);

  return result;
};

export { runLighthouse };
