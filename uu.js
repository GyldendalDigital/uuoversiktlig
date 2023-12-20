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
 * @returns {Promise<{title: string, totalScore: number, result: import("lighthouse").RunnerResult}>}
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

  const title = await page.title();
  const totalScore = result.lhr.categories.accessibility.score;
  // const audits = objectMap(result.lhr.audits, toSimpleAudit);

  console.debug("Lighthouse done", title, totalScore);
  return { title, totalScore, result };
};

export { runLighthouse };

/**
 *
 * @param {import("lighthouse/types/lhr/audit-result").Result} a
 * @returns {import("./types").LighthouseAudit}
 */
const toSimpleAudit = (a) => ({ id: a.id, title: a.title, score: a.score });

const objectMap = (obj, fn) =>
  Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]));
