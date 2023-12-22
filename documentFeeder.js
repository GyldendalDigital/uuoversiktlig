import { ServiceBusClient } from "@azure/service-bus";
import activityIds from "./activity-id-list.json" assert { type: "json" };
import { logger } from "./utils.js";

const log = logger("Feeder").log;

/**
 * Temporary replacement for CMS message service
 */

// TODO: replace with @azure/identity
const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

const messages = activityIds.map((id) => ({ body: "https://stage.skolestudio.no/preview-content/" + id }));

const chunkArray = (array, chunkSize) =>
  Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, index) =>
    array.slice(index * chunkSize, (index + 1) * chunkSize)
  );

const main = async () => {
  const start = Date.now();
  const sbClient = new ServiceBusClient(connectionString);

  const sender = sbClient.createSender(queueName);

  log("message count", messages.length);

  const chunks = chunkArray(messages, 100);

  log("chunk count", chunks.length);

  let sentCount = 0;

  for (const chunk of chunks) {
    try {
      const batch = await sender.createMessageBatch();

      for (let i = 0; i < chunk.length; i++) {
        if (!batch.tryAddMessage(chunk[i])) {
          log(`The message ${chunk[i].body} is too large to fit in the batch.`);
          continue;
        }
      }

      await sender.sendMessages(batch);

      sentCount += batch.count;
      log(`${sentCount}/${messages.length} sent. ${(Date.now() - start) / 1000}s elapsed`);
    } catch (err) {
      log("error sending batch", err);
    }
  }

  log(`finished. ${sentCount}/${messages.length} messages successfully sent in ${(Date.now() - start) / 1000}s`);

  await sender.close();
  await sbClient.close();
};

// call the main function
main().catch((err) => {
  log("error: ", err);
  process.exit(1);
});
