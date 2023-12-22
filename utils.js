import { config } from "dotenv";
config();

export const logger = (/** @type {string} */ namespace) => ({
  log: logFromNamespace(namespace),
});

const logFromNamespace =
  (/** @type {string} */ namespace) =>
  (msg, ...rest) =>
    true ? console.debug(`[${namespace}] ${msg}`, ...rest) : null;
