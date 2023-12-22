import { delay, ServiceBusClient } from "@azure/service-bus";
import { runUrl } from "./runUrl.js";
import { logger } from "./utils.js";

const log = logger("ServiceBus").log;

// TODO: replace with @azure/identity
const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;

const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME;

export const subscribeToMessages = async () => {
  const sbClient = new ServiceBusClient(connectionString);

  const receiver = sbClient.createReceiver(queueName);

  const processMessage = async (messageReceived) => {
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

  // Waiting long enough before closing the sender to send messages
  // await delay(20000);

  // await receiver.close();
  // await sbClient.close();
};
