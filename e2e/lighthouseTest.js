import lighthouse from "lighthouse";
import { userAgents, screenEmulationMetrics } from "lighthouse/core/config/constants.js";
import { logger } from "./utils.js";

const log = logger("Lighthouse").log;

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
    skipAboutBlank: true,
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
      enabled: false,
    };
  }

  log("start");

  let lighthouseRunnerResult;
  try {
    lighthouseRunnerResult = await lighthouse(
      url,
      { logLevel: process.env.DEBUG === "true" ? "info" : "silent" },
      lighthouseOptions,
      page
    );
  } catch (error) {
    log("error", error);
  }

  log("end");

  return {
    isEnabled: true,
    isSuccess: !lighthouseRunnerResult.lhr.runtimeError,
    report: lighthouseRunnerResult.lhr,
    a11yScore: lighthouseRunnerResult.lhr?.categories?.accessibility?.score,
    failingAudits: objectMap(lighthouseRunnerResult.lhr.audits, toSimpleAudit).filter(
      (a) => a.score !== null && a.score !== 1
    ),
  };
};

/**
 * @param {import("lighthouse/types/lhr/audit-result.js").Result} a
 */
const toSimpleAudit = (a) => ({
  id: a.id,
  title: a.title,
  score: a.score,
});

const objectMap = (obj, fn) => Object.entries(obj).map(([k, v], i) => fn(v, k, i));
