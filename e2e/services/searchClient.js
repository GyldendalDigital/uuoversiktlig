import algoliasearch from "algoliasearch";
import { logger } from "../utils.js";

/**
 * Index e2e metadata for each tested URL to a record in Algolia
 */

const log = logger("Algolia").log;

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY_SERVER;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME_SERVER;

const client = algoliasearch.default(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Create an index (or connect to it, if an index with the name `ALGOLIA_INDEX_NAME` already exists)
// https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
const index = client.initIndex(ALGOLIA_INDEX_NAME);

export const saveRecords = async (records) => {
  if (!records.length) {
    log("no records to index");
    return [];
  }

  try {
    for (const record of records) {
      if (!record.objectID) {
        throw new Error("Missing objectID");
      }
      if (JSON.stringify(record).length > 10000) {
        throw new Error("Record too large");
      }
    }

    log("indexing records", records);

    const indexResult = await index.saveObjects(records);
    return indexResult.objectIDs;
  } catch (error) {
    log("indexing error", error);
    throw error;
  }
};
