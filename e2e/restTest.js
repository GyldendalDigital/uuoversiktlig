/**
 * Other tests
 *
 * @param {import("puppeteer/lib/types.js").Page} page
 */
export const runRestTest = async (page) => {
  const restHasIdenticalAriaLabels = await page.evaluate(() => {
    const inputFields = Array.from(document.querySelectorAll("input"));

    const ariaLabels = inputFields.map((input) => {
      const label = input.getAttribute("aria-label");
      return label === null ? null : label.trim();
    });

    const identicalLabels = ariaLabels.filter((label, index, labels) => labels.indexOf(label) !== index);

    return identicalLabels.length > 0;
  });

  //TODO: make sure it works
  const specialCharacterData = await page.evaluate(() => {
    const specialCharacters = ["–", "—"];
    const specialCharacterList = [];

    document.querySelectorAll("div[class^='SectionFocusContainer'][lang],div[class^='sc-'][lang]").forEach(
      /** @param {HTMLDivElement} el */ (el) => {
        if (!el.innerText) return;

        for (const specialCharacter of specialCharacters) {
          const count = el.innerText.match(new RegExp(specialCharacter, "g"))?.length;
          if (count) {
            for (let i = 0; i < count; i++) {
              specialCharacterList.push(specialCharacter);
            }
          }
          console.log("a", el.innerText.match(/–|—/g))
        }

        // "".match(/–|—/g)?.length
      }
    );
console.log(specialCharacterList);
    return specialCharacterList.reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {});
  });

  return {
    restHasIdenticalAriaLabels,
    ...specialCharacterData,
  };
};
