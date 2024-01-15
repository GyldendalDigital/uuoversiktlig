/**
 * Various tests for headings, like making they exist
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runHeadingTest = async (page) => {
  // fetch all h elements
  const headingData = await page.evaluate(() =>
    ["1", "2", "3", "4", "5", "6"].reduce(
      (a, v) => ({ ...a, [`headingH${v}Count`]: document.querySelectorAll("h" + v).length }),
      {}
    )
  );
  // @ts-ignore
  const headingH3Exists = headingData.headingH3Count > 0;

  const labelSectionData = await page.evaluate(() => {
    const firstSection = document.querySelector(".visual-validation-wrapper");

    const labelSelector = "section[class^='sc-label']";
    const labelHeadingSelector = ["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => `${labelSelector} ${h}`).join(", ");

    const headingFirstSectionIsLabelWithH3 = firstSection && !!firstSection.querySelector(labelHeadingSelector);

    const headingLabelSectionCount = document.querySelectorAll(labelSelector).length;

    const headingLabelSectionHeadingCount = document.querySelectorAll(labelHeadingSelector).length;

    return {
      headingFirstSectionIsLabelWithH3,
      headingLabelSectionCount,
      headingLabelSectionHeadingCount,
      headingAllLabelSectionsAreHeadings: headingLabelSectionCount === headingLabelSectionHeadingCount,
    };
  });

  const expandSectionData = await page.evaluate(() => {
    const expandSelector = "section[class^='sc-expand']";
    const expandHeadingSelector = ["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => `${expandSelector} ${h}`).join(", ");

    const headingExpandSectionCount = document.querySelectorAll(expandSelector).length;

    const headingexpandSectionHeadingCount = document.querySelectorAll(expandHeadingSelector).length;

    return {
      headingExpandSectionCount,
      headingexpandSectionHeadingCount,
      headingAllExpandSectionsAreHeadings: headingExpandSectionCount === headingexpandSectionHeadingCount,
    };
  });

  const headingAutoCorrections = await page.evaluate(() => {
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
    ...headingData,
    headingH3Exists,
    ...labelSectionData,
    ...expandSectionData,
    headingAutoCorrections,
  };
};
