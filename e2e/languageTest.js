import { sectionLangWrapperSelector } from "./sectionConstants.js";
import { langFromFrancToIso, langFromIsoToFranc, logger } from "./utils.js";
import { francAll } from "franc";

const log = logger("Language").log;

/**
 * Do various tests on section texts to check for language errors
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 * @param {string[]} subjects
 */
export const runLanguageTest = async (page, subjects) => {
  // options
  const minimumTextLengthForDetection = 3;
  const maxScoreForSecond = 0.75;

  // retrieve all section texts
  const sectionTest = await page.evaluate(
    (sectionLangWrapperSelector, minimumTextLengthForDetection) => {
      const texts = [];
      let hasInnerLangAttributes = false;

      /** Select all sections with lang attribute (should be all) */
      document.querySelectorAll(sectionLangWrapperSelector).forEach(
        /** @param {HTMLDivElement} el */ (el) => {
          if (!el.innerText || el.innerText.length < minimumTextLengthForDetection) return;

          // probably already language tagged, skip. Also franc performs poorly on short texts
          const subElementsWithLang = el.querySelectorAll("[lang]");
          if (subElementsWithLang.length > 0) {
            hasInnerLangAttributes = true;
            return;
          }

          // retrieve alt text from images
          const subElementsWithAltText = el.querySelectorAll("[alt]");
          if (subElementsWithAltText.length > 0) {
            subElementsWithAltText.forEach((elWithAlt) => {
              texts.push({
                lang: elWithAlt.getAttribute("lang") ?? el.lang,
                text: elWithAlt.getAttribute("alt")?.trim(),
                origin: "alt",
              });
            });
          }

          // retrieve aria labels
          const subElementsWithAriaLabel = el.querySelectorAll("[aria-label]");
          if (subElementsWithAriaLabel.length > 0) {
            subElementsWithAriaLabel.forEach((elWithLabel) => {
              texts.push({
                lang: elWithLabel.getAttribute("lang") ?? el.lang,
                text: elWithLabel.getAttribute("aria-label")?.trim(),
                origin: "aria-label",
              });
            });
          }

          texts.push({
            lang: el.lang,
            text: el.innerText.replaceAll("\n", " ").trim(),
            origin: el.nodeName.toLowerCase(),
          });
        }
      );
      return { texts, hasInnerLangAttributes };
    },
    sectionLangWrapperSelector,
    minimumTextLengthForDetection
  );

  const possibleLanguages = sectionTest.texts
    .map((t) => t.lang)
    .filter((lang) => lang)
    .map(langFromIsoToFranc);

  if (subjects.includes("engelsk")) possibleLanguages.push("eng");
  if (subjects.includes("fransk")) possibleLanguages.push("fra");
  if (subjects.includes("tysk")) possibleLanguages.push("deu");
  if (subjects.includes("spansk")) possibleLanguages.push("spa");

  const only = [...new Set(possibleLanguages)];
  log("only", only);

  // detect language section texts
  const errorSuggestions = sectionTest.texts
    .map((t) => {
      const francLang = langFromIsoToFranc(t.lang);
      const mostProbableLangs = francAll(t.text, {
        only,
        minLength: minimumTextLengthForDetection,
      });

      log(`[lang=${t.lang}] [franc=${mostProbableLangs}] ${t.text.slice(0, 50) + (t.text.length > 50 ? "..." : "")}`);

      return {
        lang: t.lang,
        francLang,
        mostProbableLang: mostProbableLangs[0],
        secondMostProbableLang: mostProbableLangs[1],
        text: t.text.slice(0, 50) + (t.text.length > 50 ? "..." : ""),
        origin: t.origin,
      };
    })
    // remove cases where franc can't detect the language
    .filter((x) => x.mostProbableLang[0] !== "und")
    // remove cases that are probably correct
    .filter((x) => x.mostProbableLang[0] !== x.francLang)
    // remove suggestions that are very uncertain
    .filter((x) => x.secondMostProbableLang[1] <= maxScoreForSecond)
    .map((x) => ({
      lang: x.lang,
      langSuggestion: langFromFrancToIso(x.mostProbableLang[0]),
      text: x.text,
      origin: x.origin,
    }));

  return {
    isMissingLangAttributesInSection: !sectionTest.hasInnerLangAttributes,
    errorSuggestions,
    hasErrorSuggestions: errorSuggestions.length > 0,
  };
};
