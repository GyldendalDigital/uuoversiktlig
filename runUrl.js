import { runBrowserTest } from "./browserTest.js";
import { saveBlob } from "./blobStorage.js";
import { saveRecords } from "./searchClient.js";
import { logger } from "./utils.js";

const log = logger("Runner").log;

export const runUrl = async (/** @type {string} */ inputUrl) => {
  if (!inputUrl || !inputUrl.includes("://")) {
    log("Invalid URL", inputUrl);
    throw Error("Invalid URL");
  }

  log("start", inputUrl);

  // remove trailing slash
  const url = inputUrl.replace(/\/$/, "");

  const { lighthouseReport, ...uiTestRecord } = await runBrowserTest(url);

  const id = url.split("://")[1].replaceAll("/", "-");

  const jsonUrl = await saveBlob(id, JSON.stringify(lighthouseReport));

  const record = {
    objectID: id,
    url,
    jsonUrl,
    ...uiTestRecord,
  };

  await saveRecords([record]);

  log("end", inputUrl);

  return record;
};
