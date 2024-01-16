import { genericSectionSelectors } from "./sectionConstants.js";

/**
 * Other tests
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runRestTest = async (page) => {
  const identicalAriaLabels = await page.evaluate(() => {
    const inputFields = Array.from(document.querySelectorAll("input"));

    const ariaLabels = inputFields.map((input) => {
      const label = input.getAttribute("aria-label");
      return label === null ? null : label.trim();
    });

    return [...new Set(ariaLabels.filter((label, i, labels) => label && labels.indexOf(label) !== i))];
  });

  const specialCharacters = await page.evaluate((genericSectionSelectors) => {
    // reference to slack discussion about rules for special characters:
    // https://gyldendal.slack.com/archives/C06E50J0JQ4/p1705405957697729
    const regexp = new RegExp("\u{2013}|\u{2014}|\u{00F7}|\u{003A}|\u{2022}|\u{B7}|\u{D7}|\u{002}", "gu");
    const charactersFound = [];

    document.querySelectorAll(genericSectionSelectors).forEach(
      /** @param {HTMLDivElement} el */ (el) => {
        if (!el.innerText) return;

        const matches = el.innerText.match(regexp);
        if (matches) charactersFound.push(...matches);
      }
    );

    const specialCharacterCount = charactersFound.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {});

    return Object.entries(specialCharacterCount).map(([character, count]) => ({
      character,
      unicode: character.codePointAt(0).toString(16),
      count,
    }));
  }, genericSectionSelectors);

  const textsFlaggedForUppercase = await page.evaluate((genericSectionSelectors) => {
    const texts = [];

    document.querySelectorAll(genericSectionSelectors).forEach(
      /** @param {HTMLDivElement} el */ (el) => {
        if (!el.innerText || el.innerText.length < 10) return;

        texts.push(el.innerText);
      }
    );

    const threshold = 0.5;
    const flaggedTexts = texts.filter((text) => {
      const uppercaseLetters = text.match(/[A-ZÆØÅ]/g)?.length ?? 0;
      const lowercaseLetters = text.match(/[a-zæøå]/g)?.length ?? 0;

      const totalLetters = uppercaseLetters + lowercaseLetters;
      if (totalLetters === 0) return false;

      const uppercasePercentage = uppercaseLetters / totalLetters;
      return uppercasePercentage >= threshold;
    });

    return flaggedTexts.map((text) => text.slice(0, 50) + (text.length > 50 ? "..." : ""));
  }, genericSectionSelectors);

  return {
    identicalAriaLabels,
    hasIdenticalAriaLabels: identicalAriaLabels.length > 0,
    specialCharacters,
    hasSpecialCharacters: specialCharacters.length > 0,
    textsFlaggedForUppercase,
    hasTextsFlaggedForUppercase: textsFlaggedForUppercase.length > 0,
  };
};
