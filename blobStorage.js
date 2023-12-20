import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
  throw Error("Azure Storage Connection string not found");
}

// TODO: replace with azure identity
// Create the BlobServiceClient object with connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerName = "lighthousereports";

/**
 *
 * @param {string} blobName
 * @returns {string}
 */
const createBlobUrl = (blobName) =>
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;

/**
 *
 * @param {string} id
 * @param {string} json
 * @returns {Promise<number>}
 */
const saveBlob = async (id, json) => {
  // Get a reference to a container
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Create the container
  await containerClient.createIfNotExists();

  // Create a unique name for the blob
  const blobName = id + ".json";

  // Get a block blob client
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.debug("Saving blob", blobName);

  // Upload data to the blob
  const uploadBlobResponse = await blockBlobClient.upload(json, json.length);
  if (!uploadBlobResponse.errorCode) {
    console.debug("Blob was uploaded successfully", blobName);
  }

  return createBlobUrl(blobName);
};

export { saveBlob };
