import { runBrowserTest } from "./browserTest.js";
import { saveBlob } from "./blobStorage.js";
import { saveRecords } from "./searchClient.js";
import { logger } from "./utils.js";

const log = logger("Runner").log;

/** Browser test a web page, save the report in blob storage, and index the metadata in Algolia */
export const runUrl = async (/** @type {string} */ inputUrl) => {
  const url = new URL(inputUrl);
  const hostname = url.hostname;
  // remove trailing slash and replace remaining slashes with dash
  const id = hostname + url.pathname.replace(/\/$/, "").replaceAll("/", "-");

  log("start", id);

  const { lighthouseReport, ...uiTestRecord } = await runBrowserTest(url.href);

  const jsonUrl = await saveBlob(id, JSON.stringify(lighthouseReport));

  const record = {
    objectID: id,
    url: url.href,
    hostname,
    jsonUrl,
    savedAt: new Date().toISOString(),
    ...uiTestRecord,
  };

  await saveRecords([record]);

  log("end", id);

  return record;
};
