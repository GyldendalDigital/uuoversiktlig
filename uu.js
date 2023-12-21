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
    locale: "nb-NO",
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
 * @returns {Promise<{title: string, totalScore: number, failingAudits: import("./types").LighthouseAudit[]}, result: import("lighthouse").RunnerResult}>}
 */
const runLighthouse = async (url) => {
  const start = Date.now();

  /// PAGE SETUP
  const browser = await launch({
    headless: "new",
  });

  const page = await browser.newPage();

  // set secret cookie if preview endpoint
  if (url.includes("/preview-content/")) {
    log("setting secret cookie");
    await page.setCookie({
      name: "PreviewContentCookieSecret",
      value: process.env.PREVIEW_COOKIE_SECRET,
      domain: new URL(url).hostname,
      path: "/",
    });
  }

  /// LIGHTHOUSE
  log("testing page", url);

  const result = await lighthouse(url, undefined, config, page);

  if (result.lhr.runtimeError) {
    throw new Error(
      JSON.stringify({
        url,
        totalElapsedMs: Date.now() - start,
        error: result.lhr.runtimeError,
      })
    );
  }

  const lighthouseReport = result.lhr;
  const lighthouseElapsedMs = result.lhr.timing.total;
  const lighthouseTotalScore = result.lhr.categories.accessibility.score;
  const lighthouseFailingAudits = objectMap(
    result.lhr.audits,
    toSimpleAudit
  ).filter((a) => a.score !== null && a.score !== 1);

  /// OTHER TESTS

  // check all input fields for identical aria-label:
  const identicalLabelCount = await page.evaluate(() => {
    const inputFields = Array.from(document.querySelectorAll("input"));

    const ariaLabels = inputFields.map((input) => {
      const label = input.getAttribute("aria-label");
      return label === null ? null : label.trim();
    });

    const identicalLabels = ariaLabels.filter(
      (label, index, labels) => labels.indexOf(label) !== index
    );

    return identicalLabels.length;
  });

  /// RETURN

  const activityData = await page.evaluate(() => {
    const activity = window.initialState?.activity;
    if (activity) {
      const getActivityThumbnail = (activity) => {
        const damImage =
          activity.thumbnailDetails ??
          activity.backgroundImageDetails ??
          (activity.scenes ? activity.scenes[0]?.backgroundImageDetails : null);

        return {
          id: damImage?.id,
          mimeType: damImage?.mimeType,
        };
      };

      return {
        learningMaterials: activity.learningMaterials,
        learningComponents: activity.learningComponents,
        subjects: activity.subjects,
        grades: activity.grades,
        differentiations: activity.differentiations,
        interdisciplinaryTopics: activity.interdisciplinaryTopics,
        topics: activity.topics,

        studentVisible: activity.studentVisible,
        thumbnail: getActivityThumbnail(activity),
      };
    }
  });

  const uiTestRecord = {
    ...activityData,
    title: await page.title(),
    totalElapsedMs: Date.now() - start,
    url,

    lighthouseReport,
    lighthouseElapsedMs,
    lighthouseTotalScore,
    lighthouseFailingAudits,

    identicalLabelCount,
  };

  log(JSON.stringify({ ...uiTestRecord, lighthouseReport: null }, null, 2));

  return uiTestRecord;
};

export { runLighthouse };

/**
 *
 * @param {import("lighthouse/types/lhr/audit-result").Result} a
 * @returns {import("./types").LighthouseAudit}
 */
const toSimpleAudit = (a) => ({ id: a.id, title: a.title, score: a.score });

const objectMap = (obj, fn) =>
  Object.entries(obj).map(([k, v], i) => fn(v, k, i));

const log = (msg, ...rest) => console.debug(`[Lighthouse] ${msg}`, ...rest);
