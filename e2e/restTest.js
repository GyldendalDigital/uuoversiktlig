/**
 * Other tests
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runRestTest = async (page) => {
  const hasIdenticalAriaLabels = await page.evaluate(() => {
    const inputFields = Array.from(document.querySelectorAll("input"));

    const ariaLabels = inputFields.map((input) => {
      const label = input.getAttribute("aria-label");
      return label === null ? null : label.trim();
    });

    const identicalLabels = ariaLabels.filter((label, index, labels) => labels.indexOf(label) !== index);

    return identicalLabels.length > 0;
  });

  const specialCharacters = await page.evaluate(() => {
    const characters = ["–", "—"];
    const charactersFound = [];

    document.querySelectorAll("div[class^='SectionFocusContainer'][lang],div[class^='sc-'][lang]").forEach(
      /** @param {HTMLDivElement} el */ (el) => {
        if (!el.innerText) return;

        for (const character of characters) {
          const count = el.innerText.match(new RegExp(character, "g"))?.length;
          if (count) {
            for (let i = 0; i < count; i++) {
              charactersFound.push(character);
            }
          }
        }
      }
    );

    const specialCharacterCount = charactersFound.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {});

    return Object.entries(specialCharacterCount).map(([character, count]) => ({
      character,
      count,
    }));
  });

  return {
    hasIdenticalAriaLabels,
    specialCharacters,
  };
};
