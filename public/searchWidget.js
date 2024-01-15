// @ts-nocheck
/* global instantsearch algoliasearch ALGOLIA_APP_ID ALGOLIA_INDEX_NAME ALGOLIA_API_KEY_FRONTEND */

/** Query Algolia directly (exposes app id and read-only api key) */
const defaultClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY_FRONTEND);

const createDamUrl = (thumbnail) => {
  if (!thumbnail?.id) return null;

  const fileExtension = thumbnail.mimeType === "image/png" ? "png" : "jpg";
  return `https://cms-prod.gyldendaldigital.no/dam/preview/${thumbnail.id}/previews/maxWidth_200_maxHeight_200.${fileExtension}/*/${thumbnail.id}.${fileExtension}`;
};

const createContentUrl = (originalUrl) => {
  if (!originalUrl) return "";
  if (!originalUrl.includes("/preview-content/")) return originalUrl;

  const contentId = originalUrl.split("/preview-content/")[1];
  return "https://stage.skolestudio.no/view--" + contentId;
};

const createRedapticUrl = (originalUrl) => {
  if (!originalUrl) return "";
  if (!originalUrl.includes("/preview-content/")) return originalUrl;

  const contentId = originalUrl.split("/preview-content/")[1];
  return "https://redaptic.gyldendaldigital.no/" + contentId;
};

const createRetestUrl = (originalUrl) => {
  if (!originalUrl) return "";

  return "/test?url=" + encodeURIComponent(originalUrl);
};

const createHeaderCountPreview = (hit) => {
  const headers = [];
  if (!!hit["h3Count"]) headers.push("H1");
  if (!!hit["h4Count"]) headers.push("H2");
  if (!!hit["h5Count"]) headers.push("H3");
  if (!!hit["h6Count"]) headers.push("H4");
  return headers.join(" ");
};

const translateHeadingLevel = (headingTag) => "H" + (parseInt(headingTag.replace(/\D/g, "")) - 2);

const isCorrectHeadingOrder = (hit) => {
  if (!hit["h3Count"]) return false;
  if (!hit["h4Count"] && (!!hit["h5Count"] || !!hit["h6Count"])) return false;
  if (!hit["h5Count"] && !!hit["h6Count"]) return false;
  return true;
};

const mapFrancLang = (francLang) => {
  switch (francLang) {
    case "nno":
      return "nn-NO";
    case "nob":
      return "nb-NO";
    case "eng":
      return "en-GB";
    case "deu":
      return "de-DE";
    case "fra":
      return "fr-FR";
    case "spa":
      return "es-ES";
    default:
      return francLang;
  }
};

export const defaultFilterOptions = {
  limit: 5,
  showMore: true,
  showMoreLimit: 200,
  sortBy: (a, b) => (a.name.localeCompare(b.name) ? 1 : -1),
};

const searchBox = () =>
  instantsearch.widgets.searchBox({
    container: "#searchbox",
  });

const hits = () =>
  instantsearch.widgets.hits({
    container: "#hits",
    templates: {
      item: (hit, { html, components }) => html`
        <article>
          <div class="hit-image">
            <img src="${createDamUrl(hit.thumbnail)}" />
          </div>
          <div class="hit-content">
            <h3><a href="${createContentUrl(hit.url)}" target="_blank" rel="noopener noreferrer">${hit.title}</a></h3>

            <p>
              ${hit.learningMaterials ? ` ${hit.learningMaterials.join(", ")} ` : null}
              ${hit.subjects ? `${hit.subjects.join(", ")} ` : null} ${hit.grades ? `${hit.grades.join(", ")} ` : null}
            </p>

            <a class="redaptic-link" href="${createRedapticUrl(hit.url)}" target="_blank" rel="noopener noreferrer">
              <img class="redaptic-svg" src="/redaptic.svg" />
            </a>

            <details>
              <p>
                Automatisk test score: ${hit.lighthouseTotalScore ? " " + hit.lighthouseTotalScore * 100 : null}% ${" "}
                <a
                  href="https://googlechrome.github.io/lighthouse/viewer/?jsonurl=${hit.jsonUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vis rapport
                </a>
              </p>
              <br />

              <p>
                Overskriftsnivåer:
                <span class="${isCorrectHeadingOrder(hit) ? "green" : "red"}"> ${createHeaderCountPreview(hit)}</span>
              </p>
              ${hit.hasAutoCorrectedHeadings
                ? html`<details>
                    <summary class="orange">Autokorrigeringer</summary>
                    ${hit.autoCorrectedHeadings?.map(
                      (h) => html`<p>
                        <code class="orange">${translateHeadingLevel(h.originalTag)} </code>
                        <code class="green">${translateHeadingLevel(h.newTag)}</code>
                        <br />
                        <i>${h.text}</i>
                      </p>`
                    )}
                  </details>`
                : null}
              <br />

              <p>
                ${hit.hasIncorrectLanguageTexts
                  ? html`Språkmarkering
                      <details>
                        <summary class="orange">Forslag på endringer</summary>
                        ${hit.incorrectLanguageTexts.map(
                          (langText) => html`<p>
                            <code class="orange">${langText.lang} </code>
                            <code class="green">${mapFrancLang(langText.mostProbableLang)}</code>
                            <br />
                            <i>${langText.text}</i>
                          </p>`
                        )}
                      </details>`
                  : null}
              </p>
              <br />

              <p>${hit.savedAt ? `Indeksert: ${new Date(hit.savedAt).toLocaleString()}` : null}</p>

              <a class="retest-link" href="${createRetestUrl(hit.url)}" target="_blank" rel="noopener noreferrer">
                Test på nytt
              </a>
            </details>
          </div>
        </article>
      `,
    },
  });

const pagination = () =>
  instantsearch.widgets.pagination({
    container: "#pagination",
    showFirst: false,
    showPrevious: false,
    showNext: false,
    showLast: false,
  });

const tags = () => [
  instantsearch.widgets.panel({
    templates: { header: "Verk" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#learning-materials",
    attribute: "learningMaterials",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Komponent" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#learning-components",
    attribute: "learningComponents",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Fag" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#subjects",
    attribute: "subjects",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Trinn" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#grades",
    attribute: "grades",
  }),
];

const headingCounts = () => [
  instantsearch.widgets.refinementList({
    ...defaultFilterOptions,
    container: "#hasAutoCorrectedHeadings",
    attribute: "hasAutoCorrectedHeadings",
    showMore: false,
    transformItems: (items, { results }) =>
      items
        .filter((item) => item.value === "true")
        .map((item) => ({
          ...item,
          highlighted: `Autokorrigert`,
          label: `Autokorrigert`,
        })),
  }),
  instantsearch.widgets.refinementList({
    ...defaultFilterOptions,
    container: "#h3Count",
    attribute: "h3Count",
    limit: 1,
    showMore: false,
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        highlighted: `Uten H1`,
        label: `Uten H1`,
      })),
  }),
  instantsearch.widgets.refinementList({
    ...defaultFilterOptions,
    container: "#h4Count",
    attribute: "h4Count",
    limit: 1,
    showMore: false,
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        highlighted: `Uten H2`,
        label: `Uten H2`,
      })),
  }),
  instantsearch.widgets.refinementList({
    ...defaultFilterOptions,
    container: "#h5Count",
    attribute: "h5Count",
    limit: 1,
    showMore: false,
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        highlighted: `Uten H3`,
        label: `Uten H3`,
      })),
  }),
  instantsearch.widgets.refinementList({
    ...defaultFilterOptions,
    container: "#h6Count",
    attribute: "h6Count",
    limit: 1,
    showMore: false,
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        highlighted: `Uten H4`,
        label: `Uten H4`,
      })),
  }),
  instantsearch.widgets.numericMenu({
    ...defaultFilterOptions,
    container: "#scLabelsWithHeadingCount",
    attribute: "scLabelsWithHeadingCount",
    items: [{ label: "Uten Label-overskrift", start: 0, end: 0 }],
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        count: item.isRefined && results ? results.nbHits : 0,
      })),
    templates: {
      item(data, { html }) {
        return html`<label class="${data.cssClasses.label}">
          <input
            type="checkbox"
            class="${data.cssClasses.radio}"
            name="${data.attribute}"
            checked="${data.isRefined ? "checked" : ""}"
          />
          <span class="${data.cssClasses.labelText}"> ${data.label} </span>
          <span class="${data.count ? "ais-RefinementList-count" : null}">${data.count ? `${data.count}` : null}</span>
        </label>`;
      },
    },
  }),
  instantsearch.widgets.numericMenu({
    ...defaultFilterOptions,
    container: "#scExpandsWithHeadingCount",
    attribute: "scExpandsWithHeadingCount",
    items: [{ label: "Uten Expand-overskrift", start: 0, end: 0 }],
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        count: item.isRefined && results ? results.nbHits : 0,
      })),
    templates: {
      item(data, { html }) {
        return html`<label class="${data.cssClasses.label}">
          <input
            type="checkbox"
            class="${data.cssClasses.radio}"
            name="${data.attribute}"
            checked="${data.isRefined ? "checked" : ""}"
          />
          <span class="${data.cssClasses.labelText}"> ${data.label} </span>
          <span class="${data.count ? "ais-RefinementList-count" : null}">${data.count ? `${data.count}` : null}</span>
        </label>`;
      },
    },
  }),
];

const score = () =>
  instantsearch.widgets.panel({
    templates: { header: "Score i automatisk test" },
  })(instantsearch.widgets.numericMenu)({
    ...defaultFilterOptions,
    container: "#score",
    attribute: "lighthouseTotalScore",
    items: [{ label: "Alle" }, { label: "100%", start: 1 }, { label: "Under 100%", end: 0.99 }],
    transformItems: (items, { results }) =>
      items.map((item) => ({
        ...item,
        count: item.isRefined && results ? results.nbHits : 0,
      })),
    templates: {
      item(data, { html }) {
        return html`<label class="${data.cssClasses.label}">
          <input
            type="radio"
            class="${data.cssClasses.radio}"
            name="${data.attribute}"
            checked="${data.isRefined ? "checked" : ""}"
          />
          <span class="${data.cssClasses.labelText}"> ${data.label} </span>
          <span class="${data.count ? "ais-RefinementList-count" : null}">${data.count ? `${data.count}` : null}</span>
        </label>`;
      },
    },
  });

// const identicalLabelCount = () =>
//   instantsearch.widgets.numericMenu({
//     container: "#identicalLabelCount",
//     attribute: "identicalLabelCount",
//     items: [
//       { label: "Uten identiske ledetekster", start: 0, end: 0 },
//       { label: "Med identiske ledetekster", start: 1 },
//     ],
//     transformItems: (items, { results }) =>
//       items.map((item) => ({
//         ...item,
//         count: item.isRefined && results ? results.nbHits : 0,
//       })),
//     templates: {
//       item(data, { html }) {
//         console.log(data);
//         return html`<label class="${data.cssClasses.label}">
//           <input
//             type="checkbox"
//             class="${data.cssClasses.radio}"
//             name="${data.attribute}"
//             checked="${data.isRefined ? "checked" : ""}"
//           />
//           <span class="${data.cssClasses.labelText}"> ${data.label} </span>
//           <span class="${data.count ? "ais-RefinementList-count" : null}">${data.count ? `${data.count}` : null}</span>
//         </label>`;
//       },
//     },
//   });

const failingAudits = () =>
  instantsearch.widgets.panel({
    templates: { header: "Anmerkninger i automatisk test" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#audits",
    attribute: "lighthouseFailingAudits.title",
  });

const sectionUsage = () =>
  instantsearch.widgets.panel({
    templates: { header: "Brukte seksjoner" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#sectionElementTags",
    attribute: "sectionElementTags",
  });

const missingTitle = () =>
  instantsearch.widgets.toggleRefinement({
    ...defaultFilterOptions,
    container: "#isMissingTitle",
    attribute: "isMissingTitle",
    templates: {
      labelText(data, { html }) {
        const count = data.onFacetValue.count;
        return html`Mangler tittel <span class="${count ? "ais-RefinementList-count" : null}">${count}</span>`;
      },
    },
  });

const activityMode = () =>
  instantsearch.widgets.panel({
    templates: { header: "Aktivitetsmodus" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#mode",
    attribute: "mode",
    transformItems(items) {
      return items.map((item) => {
        const label =
          item.label === "0"
            ? "Steps"
            : item.label === "1"
            ? "Scroll"
            : item.label === "2"
            ? "SlideshowHorizontal"
            : "SlideshowVertical";
        return {
          ...item,
          label,
          highlighted: label,
        };
      });
    },
  });

const parentDocumentTypes = () =>
  instantsearch.widgets.panel({
    templates: { header: "Referanse fra" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#parentDocumentTypes",
    attribute: "parentDocumentTypes",
  });

const hostname = () =>
  instantsearch.widgets.panel({
    templates: { header: "Domene" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#hostname",
    attribute: "hostname",
  });

const languageFilters = () => [
  instantsearch.widgets.toggleRefinement({
    ...defaultFilterOptions,
    container: "#isForeignLanguageWithoutLangAttributes",
    attribute: "isForeignLanguageWithoutLangAttributes",
    templates: {
      labelText(data, { html }) {
        const count = data.onFacetValue.count;
        return html`Fremmedspråk uten markering
          <span class="${count ? "ais-RefinementList-count" : null}">${count}</span>`;
      },
    },
  }),
  instantsearch.widgets.toggleRefinement({
    ...defaultFilterOptions,
    container: "#hasIncorrectLanguageTexts",
    attribute: "hasIncorrectLanguageTexts",
    templates: {
      labelText(data, { html }) {
        const count = data.onFacetValue.count;
        return html`Forslag til endringer <span class="${count ? "ais-RefinementList-count" : null}">${count}</span>`;
      },
    },
  }),
];

export const search = () => {
  const s = instantsearch({
    indexName: ALGOLIA_INDEX_NAME,
    searchClient: defaultClient,
    routing: true,
  });
  s.addWidgets([
    searchBox(),
    hits(),
    pagination(),
    ...tags(),
    ...headingCounts(),
    ...languageFilters(),
    missingTitle(),
    // identicalLabelCount(),
  ]);
  return s;
};

export const searchDeveloper = () => {
  const s = search();

  s.addWidgets([sectionUsage(), failingAudits(), score(), activityMode(), parentDocumentTypes(), hostname()]);
  return s;
};
