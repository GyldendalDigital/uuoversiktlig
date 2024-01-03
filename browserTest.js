import { launch } from "puppeteer";
import lighthouse from "lighthouse";
import { userAgents, screenEmulationMetrics } from "lighthouse/core/config/constants.js";
import { logger } from "./utils.js";

const log = logger("BrowserTest").log;

/** @type {import("lighthouse/types/config.js").default} */
const lighthouseOptions = {
  extends: "lighthouse:default",
  settings: {
    locale: "nb",
    output: "html",
    onlyCategories: ["accessibility"],
    formFactor: "desktop",
    screenEmulation: screenEmulationMetrics.desktop,
    emulatedUserAgent: userAgents.desktop,
  },
};

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

    log("ping url");

    const ping = await page.goto(url, { waitUntil: "networkidle0" });
    const status = ping.status();
    if (status < 200 || status >= 400) {
      throw new Error(ping.statusText() || `Ping failed with status ${status}`);
    } else {
      log("ping", status);
    }

    log("lighthouse start");

    const result = await lighthouse(url, undefined, lighthouseOptions, page);

    if (result.lhr.runtimeError) {
      log("lighthouse error", url);
      throw new Error(
        JSON.stringify({
          url,
          totalElapsedMs: Date.now() - start,
          error: result.lhr.runtimeError,
        })
      );
    }

    log("lighthouse end", url);

    const lighthouseReport = result.lhr;
    const lighthouseElapsedMs = result.lhr.timing.total;
    const lighthouseTotalScore = result.lhr.categories.accessibility.score;
    const lighthouseFailingAudits = objectMap(result.lhr.audits, toSimpleAudit).filter(
      (a) => a.score !== null && a.score !== 1
    );

    /// OTHER TESTS
    log("other start", url);

    // check all input fields for identical aria-label:
    const identicalLabelCount = await page.evaluate(() => {
      const inputFields = Array.from(document.querySelectorAll("input"));

      const ariaLabels = inputFields.map((input) => {
        const label = input.getAttribute("aria-label");
        return label === null ? null : label.trim();
      });

      const identicalLabels = ariaLabels.filter((label, index, labels) => labels.indexOf(label) !== index);

      return identicalLabels.length;
    });

    // fetch all h elements (sections in Skolestudio translates h1 to h3 and so on)
    const hCount = await page.evaluate(() =>
      ["h3", "h4", "h5", "h6"].reduce((a, v) => ({ ...a, [v + "Count"]: document.querySelectorAll(v).length }), {})
    );

    // check sc-labels with headings as children
    const scLabelsWithHeadingCount = await page.evaluate(
      () =>
        document.querySelectorAll(["h3", "h4", "h5", "h6"].map((h) => `section[class^='sc-label'] ${h}`).join(", "))
          .length
    );

    // check sc-expands with headings as children
    const scExpandsWithHeadingCount = await page.evaluate(
      () =>
        document.querySelectorAll(["h3", "h4", "h5", "h6"].map((h) => `section[class^='sc-expand'] ${h}`).join(", "))
          .length
    );

    const activityData = await page.evaluate(() => {
      // @ts-ignore
      const initialState = window.initialState;
      const activity = initialState?.activity;
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
          mode: initialState?.originalActivityMode,
          sceneCount: activity.scenes?.length || 0,
          sectionElementTags: initialState?.sectionElementTags,
          isMissingTitle: !activity.title?.value,
        };
      }
    });

    log("other end", url);

    const title = await page.title();

    /// RETURN

    const uiTestRecord = {
      ...activityData,
      title,
      totalElapsedMs: Date.now() - start,
      url,

      lighthouseReport,
      lighthouseElapsedMs,
      lighthouseTotalScore,
      lighthouseFailingAudits,

      identicalLabelCount,
      ...hCount,
      scLabelsWithHeadingCount,
      scExpandsWithHeadingCount,
    };

    return uiTestRecord;
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

/**
 *
 * @param {import("lighthouse/types/lhr/audit-result.js").Result} a
 * @returns {import("./types.js").LighthouseAudit}
 */
const toSimpleAudit = (a) => ({ id: a.id, title: a.title, score: a.score });

const objectMap = (obj, fn) => Object.entries(obj).map(([k, v], i) => fn(v, k, i));
