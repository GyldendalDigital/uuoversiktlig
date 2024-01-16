import { createBlobName, createBlobUrl, saveBlob } from "./services/blobStorage.js";
import { saveRecords } from "./services/searchClient.js";
import { logger } from "./utils.js";
import { runLighthouseTest } from "./lighthouseTest.js";
import { runActivityDataTest } from "./activityDataTest.js";
import { runLanguageTest } from "./languageTest.js";
import { runHeadingTest } from "./headingTests.js";
import { runRestTest } from "./restTest.js";
import { loadPage } from "./pageSetup.js";

const log = logger("Main").log;

/** Browser test a web page, save the report in blob storage, and index the metadata in Algolia */
export const runUrl = async (/** @type {string} */ inputUrl) => {
  const { href, hostname, id } = sanitizeUrl(inputUrl);

  log("start", id);

  let durations = {};
  const start = Date.now();

  const { browser, page } = await loadPage(href);
  durations.loadPage = Date.now() - start;

  try {
    let tempStart = Date.now();

    const activity = await runActivityDataTest(page);
    durations.activity = Date.now() - tempStart;

    tempStart = Date.now();

    const language = await runLanguageTest(page, activity?.subjects ?? []);
    durations.language = Date.now() - tempStart;

    tempStart = Date.now();

    const heading = await runHeadingTest(page);
    durations.heading = Date.now() - tempStart;

    tempStart = Date.now();

    const rest = await runRestTest(page);
    durations.rest = Date.now() - tempStart;

    tempStart = Date.now();

    const { report, ...lighthouse } = await runLighthouseTest(href, page);
    durations.lighthouse = Date.now() - tempStart;

    durations.total = Date.now() - start;

    const jsonUrl = lighthouse.isEnabled
      ? await saveBlob(id, JSON.stringify(report))
      : createBlobUrl(createBlobName(id));

    const record = {
      title: await page.title(),
      objectID: id,
      url: href,
      hostname,
      jsonUrl,
      savedAt: new Date().toISOString(),
      timestamp: Date.now(),
      durations,
      lighthouse,
      activity,
      language,
      heading,
      rest,
    };

    await saveRecords([record]);

    log("end", id);

    return record;
  } catch (error) {
    log("caught error", error);
    return { isError: true, error: error.message };
  } finally {
    log("cleaning up");
    await page.close();
    log("page closed", page.isClosed());
    await browser.close();
    log("browser disconnected", !browser.connected);
  }
};

const sanitizeUrl = (inputUrl) => {
  const url = new URL(inputUrl);
  const hostname = url.hostname;

  return {
    href: url.href,
    hostname: url.hostname,
    // remove trailing slash and replace remaining slashes with dash
    id: hostname + url.pathname.replace(/\/$/, "").replaceAll("/", "-"),
  };
};
