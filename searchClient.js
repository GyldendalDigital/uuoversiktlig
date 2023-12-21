// Install the API client: https://www.algolia.com/doc/api-client/getting-started/install/javascript/?client=javascript
import algoliasearch from "algoliasearch";
import { config } from "dotenv";

config();

// Get your Algolia Application ID and (admin) API key from the dashboard: https://www.algolia.com/account/api-keys
// and choose a name for your index. Add these environment variables to a `.env` file:
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY_SERVER;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

// Start the API client
// https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Create an index (or connect to it, if an index with the name `ALGOLIA_INDEX_NAME` already exists)
// https://www.algolia.com/doc/api-client/getting-started/instantiate-client-index/#initialize-an-index
const index = client.initIndex(ALGOLIA_INDEX_NAME);

/**
 * @param {import("./types").SearchRecord[]} records
 */
export const saveRecords = async (records) => {
  log("indexing records", records);
  try {
    const indexResult = await index.saveObjects(records);
    return indexResult.objectIDs;
  } catch (error) {
    log("indexing error", error);
    throw error;
  }
};

export const searchRecords = async (requests) => client.search(requests);
export const searchFacets = async (requests) =>
  client.searchForFacetValues(requests);

const log = (msg, ...rest) => console.debug(`[Algolia] ${msg}`, ...rest);
