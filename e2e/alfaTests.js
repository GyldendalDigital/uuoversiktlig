import { Audit } from "@siteimprove/alfa-act";
import { Puppeteer } from "@siteimprove/alfa-puppeteer";
import { Rules } from "@siteimprove/alfa-rules";
import { logger } from "./utils.js";

const log = logger("Alfa").log;

const blacklistedRules = ["https://alfa.siteimprove.com/rules/sia-r73", "https://alfa.siteimprove.com/rules/sia-r66"];

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

  const document = await page.evaluateHandle(() => window.document);
  // @ts-ignore
  const alfaPage = await Puppeteer.toPage(document);
  const rules = getRules(Rules.values());
  const outcomes = await Audit.of(alfaPage, rules).evaluate();
  const failingAudits = [];

  for (const json of getFailedOutcomes(outcomes)) {
    failingAudits.push({
      id: json.rule.uri,
      title: mapTitle(json.expectations, json.rule),
      targets: Array.isArray(json.target) ? json.target.map(mapTarget) : [mapTarget(json.target)],
    });
  }

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
  const failed = [];
  for (const outcome of outcomes) {
    const json = outcome.toJSON();
    if (json.outcome === "failed") {
      failed.push(json);
    }
  }
  // @ts-ignore
  return failed;
};

/**
 * @param {import("@siteimprove/alfa-act/src/outcome.js").Outcome["target"]} target
 *
 * @return {{title: string, [key: string]: string}}
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
    title: name ?? type ?? value ?? data ?? classValue ?? roleValue ?? idValue ?? hrefValue ?? "unknown",
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
