import lighthouse from "lighthouse";
import { userAgents, screenEmulationMetrics } from "lighthouse/core/config/constants.js";
import { logger } from "./utils.js";

const log = logger("BrowserTest").log;

/** @type {import("lighthouse/types/config.js").default} */
const lighthouseOptions = {
  extends: "lighthouse:default",
  settings: {
    locale: process.env.LIGHTHOUSE_LANGUAGE_ENGLISH === "1" ? "en" : "nb",
    output: "html",
    onlyCategories: ["accessibility"],
    formFactor: "desktop",
    screenEmulation: screenEmulationMetrics.desktop,
    emulatedUserAgent: userAgents.desktop,
  },
};

/**
 * @param {string} url
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runLighthouseTest = async (url, page) => {
  if (process.env.LIGHTHOUSE_DISABLED === "1") {
    log("lighthouse disabled");
    return {
      lighthouseEnabled: false,
    };
  }

  log("lighthouse start");

  const lighthouseRunnerResult = await lighthouse(url, undefined, lighthouseOptions, page);

  log("lighthouse end");

  return {
    lighthouseEnabled: true,
    lighthouseSuccess: !!lighthouseRunnerResult.lhr.runtimeError,
    lighthouseReport: lighthouseRunnerResult.lhr,
    lighthouseTotalScore: lighthouseRunnerResult.lhr?.categories?.accessibility?.score,
    lighthouseFailingAudits: objectMap(lighthouseRunnerResult.lhr.audits, toSimpleAudit).filter(
      (a) => a.score !== null && a.score !== 1
    ),
  };
};

/**
 *
 * @param {import("lighthouse/types/lhr/audit-result.js").Result} a
 * @returns {import("./types.js").LighthouseAudit}
 */
const toSimpleAudit = (a) => ({ id: a.id, title: a.title, score: a.score });

const objectMap = (obj, fn) => Object.entries(obj).map(([k, v], i) => fn(v, k, i));
