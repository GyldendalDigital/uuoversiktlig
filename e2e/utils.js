import { config } from "dotenv";
config();

export const logger = (/** @type {string} */ namespace) => ({
  log: logFromNamespace(namespace),
});

const logFromNamespace =
  (/** @type {string} */ namespace) =>
  (/** @type {string} */ msg, /** @type {any} */ ...rest) =>
    process.env.DEBUG === "true" ? console.debug(`[${namespace}] ${msg}`, ...rest) : null;

export const langFromIsoToFranc = (/** @type {string} */ lang) => {
  if (lang.includes("nn")) return "nno";
  if (lang.includes("nb")) return "nob";
  if (lang.includes("no")) return "nob";
  if (lang.includes("en")) return "eng";
  if (lang.includes("de")) return "deu";
  if (lang.includes("fr")) return "fra";
  if (lang.includes("es")) return "spa";
  return "und"; // undetermined
};

export const langFromFrancToIso = (/** @type {string} */ lang) => {
  if (lang === "nno") return "nn-NO";
  if (lang === "nob") return "nb-NO";
  if (lang === "eng") return "en-GB";
  if (lang === "deu") return "de-DE";
  if (lang === "fra") return "fr-FR";
  if (lang === "spa") return "es-ES";
  return "nb-NO";
};
