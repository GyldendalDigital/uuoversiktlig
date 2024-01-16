export const sectionLangWrapperSelector = "[class^='sc-'][lang][id]";
export const sectionWrapperSelector = ".visual-validation-wrapper";
export const sectionPrefixSelector = "[class^='sc-']";
export const sectionFocusContainer = "div[class^='SectionFocusContainer']";
export const genericSectionSelectors = [sectionPrefixSelector, sectionFocusContainer]
  .map((prefixSelector) => `${sectionWrapperSelector} ${prefixSelector}`)
  .join(",");
