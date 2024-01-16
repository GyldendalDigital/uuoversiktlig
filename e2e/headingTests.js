import { sectionWrapperSelector } from "./sectionConstants.js";

/**
 * Various tests for headings, like making sure they exist
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runHeadingTest = async (page) => {
  const allHeadingCounts = await page.evaluate(() =>
    ["1", "2", "3", "4", "5", "6"].reduce(
      (a, v) => ({ ...a, [`h${v}Count`]: document.querySelectorAll("h" + v).length }),
      {}
    )
  );

  const labelSectionData = await page.evaluate((sectionWrapperSelector) => {
    const firstSection = document.querySelector(sectionWrapperSelector);

    const labelSelector = "section[class^='sc-label']";
    const labelHeadingSelector = ["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => `${labelSelector} ${h}`).join(", ");

    const labelSectionCount = document.querySelectorAll(labelSelector).length;
    const labelSectionHeadingCount = document.querySelectorAll(labelHeadingSelector).length;

    return {
      isLabelFirstSectionAndMissingHeading: firstSection && !firstSection.querySelector(labelHeadingSelector),
      labelSectionCount,
      labelSectionHeadingCount,
      allLabelSectionsHaveHeadings: labelSectionCount > 0 && labelSectionCount === labelSectionHeadingCount,
    };
  }, sectionWrapperSelector);

  const expandSectionData = await page.evaluate(() => {
    const expandSelector = "section[class^='sc-expand']";
    const expandHeadingSelector = ["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => `${expandSelector} ${h}`).join(", ");

    const expandSectionCount = document.querySelectorAll(expandSelector).length;

    const expandSectionHeadingCount = document.querySelectorAll(expandHeadingSelector).length;

    return {
      expandSectionCount,
      expandSectionHeadingCount,
      expandSectionHeadingExists: expandSectionHeadingCount > 0,
      allExpandSectionsHaveHeadings: expandSectionCount > 0 && expandSectionCount === expandSectionHeadingCount,
    };
  });

  const autoCorrections = await page.evaluate(() => {
    const autoCorrectedHeadingsLocal = [];

    document.querySelectorAll("[data-fixed-heading]").forEach(
      /** @param {HTMLDivElement} el */ (el) => {
        autoCorrectedHeadingsLocal.push({
          originalTag: JSON.parse(el.getAttribute("data-fixed-heading"))?.originalTag?.toUpperCase(),
          newTag: el.nodeName,
          text: el.innerText,
        });
      }
    );

    return autoCorrectedHeadingsLocal;
  });

  return {
    ...allHeadingCounts,
    // @ts-ignore
    h3Exists: allHeadingCounts.h3Count > 0,
    autoCorrections,
    hasAutoCorrections: autoCorrections.length > 0,
    ...labelSectionData,
    ...expandSectionData,
  };
};
