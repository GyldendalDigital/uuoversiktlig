import { ServiceBusClient } from "@azure/service-bus";
import { runUrl } from "../main.js";
import { logger } from "../utils.js";

/**
 * Listens for messages from Azure Service Bus and runs an e2e test for the URL in the message body
 */

const log = logger("ServiceBus").log;

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

export const subscribeToMessages = async () => {
  if (process.env.AZURE_SERVICE_BUS_DISABLED === "true") {
    log("service bus disabled");
    return;
  }

  const sbClient = new ServiceBusClient(connectionString);

  const receiver = sbClient.createReceiver(queueName);

  const processMessage = async (/** @type {{ body: string; }} */ messageReceived) => {
    try {
      if (!messageReceived.body || typeof messageReceived.body !== "string") {
        throw Error("Invalid URL");
      }
      log("start");
      await runUrl(messageReceived.body);
      log("end");
    } catch (error) {
      log("caught", error);
    }
  };

  const processError = async (error) => {
    log("processError", error);
  };

  receiver.subscribe({
    processMessage,
    processError,
  });

  log("listening for messages");
};
