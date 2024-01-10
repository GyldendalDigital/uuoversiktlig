import { BlobServiceClient } from "@azure/storage-blob";
import { logger } from "./utils.js";

const log = logger("Blob").log;

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw Error("Azure Storage Connection string not found");
}

// TODO: replace with @azure/identity
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);

const containerName = "lighthousereports";

/**
 *
 * @param {string} id
 * @returns {string}
 */
export const createBlobName = (id) => id + ".json";

/**
 *
 * @param {string} blobName
 * @returns {string}
 */
export const createBlobUrl = (blobName) =>
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;

/**
 *
 * @param {string} id
 * @param {string} json
 * @returns {Promise<string>}
 */
export const saveBlob = async (id, json) => {
  // Get a reference to a container
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Create the container
  await containerClient.createIfNotExists();

  // Create a unique name for the blob
  const blobName = createBlobName(id);

  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Upload data to the blob
  const uploadBlobResponse = await blockBlobClient.upload(json, json.length);
  if (!uploadBlobResponse.errorCode) {
    log("uploaded successfully", blobName);
  }

  return createBlobUrl(blobName);
};
