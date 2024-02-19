// @ts-nocheck
/* global instantsearch algoliasearch ALGOLIA_APP_ID ALGOLIA_INDEX_NAME ALGOLIA_API_KEY_FRONTEND */

import {
  createContentUrl,
  createDamUrl,
  createHeaderCountPreview,
  createRedapticUrl,
  createRetestUrl,
  isCorrectHeadingOrder,
  translateHeadingLevel,
} from "./utils.js";

/** Query Algolia directly (exposes app id and read-only api key) */
const defaultClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY_FRONTEND);

export const defaultFilterOptions = {
  limit: 5,
  showMore: true,
  showMoreLimit: 200,
  sortBy: (a, b) => (a.name.localeCompare(b.name) ? 1 : -1),
};

const createToggleRefinement = (container, attribute, displayName) =>
  instantsearch.widgets.toggleRefinement({
    ...defaultFilterOptions,
    container,
    attribute,
    templates: {
      labelText(data, { html }) {
        const count = data.onFacetValue.count;
        return html`${displayName}
          <span class="${count ? "ais-RefinementList-count" : null}"
            >${count}</span
          >`;
      },
    },
  });

const createRefinementList = (container, attribute, header) =>
  header
    ? instantsearch.widgets.panel({
        templates: { header },
      })(instantsearch.widgets.refinementList)({
        ...defaultFilterOptions,
        container,
        attribute,
      })
    : instantsearch.widgets.refinementList({
        ...defaultFilterOptions,
        container,
        attribute,
      });

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
            <img src="${createDamUrl(hit.activity?.thumbnail)}" />
          </div>

          <div class="hit-content">
            <h3>
              <a
                href="${createContentUrl(hit.url)}"
                target="_blank"
                rel="noopener noreferrer"
                >${hit.title}</a
              >
            </h3>

            <p>
              ${hit.activity.learningMaterials
                ? ` ${hit.activity.learningMaterials.join(", ")} `
                : null}
              ${hit.activity.subjects
                ? `${hit.activity.subjects.join(", ")} `
                : null}
              ${hit.activity.grades
                ? `${hit.activity.grades.join(", ")} `
                : null}
            </p>

            <a
              class="redaptic-link"
              href="${createRedapticUrl(hit.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img class="redaptic-svg" src="/redaptic.svg" />
            </a>

            <details>
              ${hit.lighthouse.a11yScore
                ? html`
                    <p>
                      Lighthouse score: ${hit.lighthouse.a11yScore * 100}%
                      ${" "}
                      <a
                        href="https://googlechrome.github.io/lighthouse/viewer/?jsonurl=${hit.jsonUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Vis rapport
                      </a>
                    </p>
                  `
                : null}

              <p>
                Overskriftsnivåer:
                <span class="${isCorrectHeadingOrder(hit) ? "green" : "red"}">
                  ${createHeaderCountPreview(hit)}</span
                >
              </p>
              ${hit.heading.hasAutoCorrections
                ? html`<details>
                    <summary class="orange">Autokorrigeringer</summary>
                    ${hit.heading.autoCorrections?.map(
                      (h) => html`<p>
                        <code class="orange"
                          >${translateHeadingLevel(h.originalTag)}
                        </code>
                        <code class="green"
                          >${translateHeadingLevel(h.newTag)}</code
                        >
                        <br />
                        <i>${h.text}</i>
                      </p>`
                    )}
                  </details>`
                : null}
              <br />

              <p>
                Språkmarkering:
                ${hit.language.isMissingLangAttributesInSection
                  ? "Ingen markering i seksjonene"
                  : ""}
              </p>
              ${hit.language.hasErrorSuggestions
                ? html` <details>
                    <summary class="orange">Forslag på endringer</summary>
                    ${hit.language.errorSuggestions?.map(
                      (suggestion) => html`<p>
                        <code class="orange">${suggestion.lang} </code>
                        <code class="green">${suggestion.langSuggestion}</code>
                        <br />
                        <i>${suggestion.text}</i>
                      </p>`
                    )}
                  </details>`
                : null}
              <br />

              <p>
                ${hit.savedAt
                  ? `Indeksert: ${new Date(hit.savedAt).toLocaleString()}`
                  : null}
              </p>

              <a
                class="retest-link"
                href="${createRetestUrl(hit.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
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
    attribute: "activity.learningMaterials",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Komponent" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#learning-components",
    attribute: "activity.learningComponents",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Fag" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#subjects",
    attribute: "activity.subjects",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Trinn" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#grades",
    attribute: "activity.grades",
  }),
];

const headingFilters = () => [
  createToggleRefinement(
    "#hasAutoCorrections",
    "heading.hasAutoCorrections",
    "Autokorrigert"
  ),
  createToggleRefinement("#h3Exists", "heading.h3Exists", "Mangler H1"),
  createToggleRefinement(
    "#isLabelFirstSectionAndMissingHeading",
    "heading.isLabelFirstSectionAndMissingHeading",
    "Første label mangler overskrift"
  ),
  createToggleRefinement(
    "#expandSectionWithoutHeadingExists",
    "heading.expandSectionWithoutHeadingExists",
    "Minst én expand mangler overskrift"
  ),
];

const lighthouse = () => [
  createToggleRefinement(
    "#lighthouse-hasFailingAudits",
    "lighthouse.hasFailingAudits",
    "Anmerkninger i Lighthouse"
  ),
  createRefinementList(
    "#lighthouse-failingAudits",
    "lighthouse.failingAudits.title"
  ),
];

const alfa = () => [
  createToggleRefinement(
    "#alfa-hasFailingAudits",
    "alfa.hasFailingAudits",
    "Anmerkninger i Alfa"
  ),
  createRefinementList("#alfa-failingAudits", "alfa.failingAudits.title"),
];

const sectionTags = () => [
  createRefinementList(
    "#sectionElementTags",
    "activity.sectionElementTags",
    "Brukte seksjoner"
  ),
  createRefinementList(
    "#firstSectionElementTag",
    "activity.firstSectionElementTag",
    "Første seksjon"
  ),
];

const rest = () => [
  createToggleRefinement(
    "#isMissingTitle",
    "activity.isMissingTitle",
    "Mangler tittel"
  ),
  createToggleRefinement(
    "#hasIdenticalAriaLabels",
    "rest.hasIdenticalAriaLabels",
    "Har identiske ledetekster"
  ),
  createToggleRefinement(
    "#hasSpecialCharacters",
    "rest.hasSpecialCharacters",
    "Har spesialtegn"
  ),
  createToggleRefinement(
    "#hasTextsFlaggedForUppercase",
    "rest.hasTextsFlaggedForUppercase",
    "Har tekster med mange store bokstaver"
  ),
];

const timestamp = () =>
  instantsearch.widgets.panel({
    templates: { header: "Timestamp" },
  })(instantsearch.widgets.rangeSlider)({
    ...defaultFilterOptions,
    container: "#timestamp",
    attribute: "timestamp",
    // min: Date.now() - 24 * 60 * 60 * 1000, //1705650403676,
    pips: false,
  });

const activityMode = () =>
  instantsearch.widgets.panel({
    templates: { header: "Aktivitetsmodus" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#mode",
    attribute: "activity.mode",
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
  createRefinementList(
    "#parentDocumentTypes",
    "activity.parentDocumentTypes",
    "Referanse fra"
  );

const hostname = () => createRefinementList("#hostname", "hostname", "Domene");

const languageFilters = () => [
  createToggleRefinement(
    "#language-isMissingLangAttributesInSection",
    "language.isMissingLangAttributesInSection",
    "Ingen markeringer i seksjonene"
  ),
  createToggleRefinement(
    "#language-hasErrorSuggestions",
    "language.hasErrorSuggestions",
    "Forslag til endringer"
  ),
];

export const search = () => {
  const insta = instantsearch({
    indexName: ALGOLIA_INDEX_NAME,
    searchClient: defaultClient,
    routing: true,
  });

  insta.addWidgets([
    searchBox(),
    hits(),
    pagination(),
    ...tags(),
    ...headingFilters(),
    ...languageFilters(),
    ...rest(),

    // developer stuff
    ...sectionTags(),
    ...lighthouse(),
    ...alfa(),
    activityMode(),
    parentDocumentTypes(),
    hostname(),
    timestamp(),
  ]);

  return insta;
};
