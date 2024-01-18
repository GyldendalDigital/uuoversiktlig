import { Audit } from "@siteimprove/alfa-act";
import { Puppeteer } from "@siteimprove/alfa-puppeteer";
import { Rules } from "@siteimprove/alfa-rules";
import { isSkolestudioPreview, logger } from "./utils.js";

const log = logger("Alfa").log;

const blacklistedRules = [
  "https://alfa.siteimprove.com/rules/sia-r57", // The text is not included in a landmark region
];

/**
 * SiteImprove Alfa tests
 *
 * {@link https://alfa.siteimprove.com/rules | Rules }
 * {@link https://github.com/Siteimprove/alfa | Code }
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runAlfaTests = async (page) => {
  if (process.env.ALFA_DISABLED === "1") {
    log("disabled");
    return {
      enabled: false,
    };
  }

  if (isSkolestudioPreview(page.url())) {
    blacklistedRules.push("https://alfa.siteimprove.com/rules/sia-r87"); // Preview does not have a tabbable element first
  }

  const document = await page.evaluateHandle(() => window.document);
  // @ts-ignore
  const alfaPage = await Puppeteer.toPage(document);
  const rules = getRules(Rules.values());
  const outcomes = await Audit.of(alfaPage, rules).evaluate();

  /** @type {{[key: string]: FailedAudit}} */
  const o = {};

  for (const json of getFailedOutcomes(outcomes)) {
    const id = json.rule.uri.replace("https://alfa.siteimprove.com/rules/", "");

    if (!o[id]) {
      o[id] = {
        id,
        title: mapTitle(json.expectations, json.rule),
        uri: json.rule.uri,
        targets: Array.isArray(json.target) ? json.target.map(mapTarget) : [mapTarget(json.target)],
      };
    } else {
      o[id].targets = Array.isArray(json.target)
        ? [...o[id].targets, ...json.target.map(mapTarget)]
        : [...o[id].targets, mapTarget(json.target)];
    }
  }

  const failingAudits = Object.values(o);

  return {
    isEnabled: true,
    failingAudits: failingAudits.length > 100 ? failingAudits.slice(0, 100) : failingAudits,
    hasFailingAudits: failingAudits.length > 0,
  };
};

/**
 * @param {Iterable<import("@siteimprove/alfa-act/src/rule.js").Rule>} rules
 * @returns {import("@siteimprove/alfa-act/src/rule.js").Rule[]}
 */
const getRules = (rules) => {
  return [...rules].filter((r) => !blacklistedRules.includes(r.uri));
};

/**
 * @param {Iterable<import("@siteimprove/alfa-act/src/outcome.js").Outcome>} outcomes
 * @returns {import("@siteimprove/alfa-act/src/outcome.js").Outcome.Failed[]}
 */
const getFailedOutcomes = (outcomes) => {
  const failedOutcomeList = [];
  for (const outcome of outcomes) {
    const json = outcome.toJSON();
    if (json.outcome === "failed") {
      failedOutcomeList.push(json);
    }
  }
  // @ts-ignore
  return failedOutcomeList;
};

/**
 * @param {import("@siteimprove/alfa-act/src/outcome.js").Outcome["target"]} target
 *
 * @return {Target}
 */
const mapTarget = (target) => {
  const name = target.name;
  const type = target.type;
  const value = target.value;
  const data = target.data;
  const classValue = target.attributes?.find((attr) => attr.name === "class")?.value;
  const roleValue = target.attributes?.find((attr) => attr.name === "role")?.value;
  const idValue = target.attributes?.find((attr) => attr.name === "id")?.value;
  const hrefValue = target.attributes?.find((attr) => attr.name === "href")?.value;

  return {
    displayName: name ?? type ?? value ?? data ?? "unknown",
    name,
    type,
    value,
    data,
    class: classValue,
    role: roleValue,
    id: idValue,
    href: hrefValue,
  };
};

/**
 * @param {import("@siteimprove/alfa-act/src/outcome.js").Outcome.Failed["expectations"]} expectations
 * @param {import("@siteimprove/alfa-act/src/outcome.js").Outcome.Failed["rule"]} rule
 */
const mapTitle = (expectations, rule) =>
  expectations?.[0]?.[1]?.error?.message ??
  expectations?.[1]?.[1]?.error?.message ??
  expectations?.[2]?.[1]?.error?.message ??
  // @ts-ignore
  rule.requirements?.[0]?.title;

/**
 * Target of a failed outcome.
 * @typedef {{displayName: string, [key: string]: string}} Target
 */

/**
 * Failed audit.
 * @typedef { {id: string, title: string, uri: string, targets: Target[]}} FailedAudit
 */
