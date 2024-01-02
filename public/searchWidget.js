// @ts-nocheck
/* global instantsearch algoliasearch ALGOLIA_APP_ID ALGOLIA_INDEX_NAME ALGOLIA_API_KEY_FRONTEND */

/** Query Algolia directly (exposes app id and read-only api key) */
const defaultClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY_FRONTEND);

const search = instantsearch({
  indexName: ALGOLIA_INDEX_NAME,
  searchClient: defaultClient,
});

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

const createHeaderCountPreview = (hit) => {
  const headers = [];
  if (!!hit["h3Count"]) headers.push("H1");
  if (!!hit["h4Count"]) headers.push("H2");
  if (!!hit["h5Count"]) headers.push("H3");
  if (!!hit["h6Count"]) headers.push("H4");
  return headers.join(" ");
};

const defaultFilterOptions = {
  limit: 100,
  showMore: true,
  showMoreLimit: 200,
  sortBy: (a, b) => (a.name.localeCompare(b.name) ? 1 : -1),
};

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
  }),
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
            <p class="${createHeaderCountPreview(hit).startsWith("H1") ? null : "red"}">
              ${createHeaderCountPreview(hit)}
            </p>
            <p class="${hit.identicalLabelCount ? null : "grey"}">${hit.identicalLabelCount} identiske ledetekster</p>
            <p class="${hit.scLabelsWithHeadingCount ? null : "grey"}">
              ${hit.scLabelsWithHeadingCount} Label-seksjoner med overskriftsnivå
            </p>
            <p class="${hit.scExpandsWithHeadingCount ? null : "grey"}">
              ${hit.scExpandsWithHeadingCount} Expand-seksjoner med overskriftsnivå
            </p>
            <a class="redaptic-link" href="${createRedapticUrl(hit.url)}" target="_blank" rel="noopener noreferrer"
              ><img class="redaptic-svg" src="/redaptic.svg"
            /></a>
          </div>
        </article>
      `,
    },
  }),
  // instantsearch.widgets.configure({
  //   hitsPerPage: 8,
  // }),
  instantsearch.widgets.panel({
    templates: { header: "Verk" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#learning-materials",
    attribute: "learningMaterials",
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
  instantsearch.widgets.panel({
    templates: { header: "Anmerkninger i automatisk test" },
  })(instantsearch.widgets.refinementList)({
    ...defaultFilterOptions,
    container: "#audits",
    attribute: "lighthouseFailingAudits.title",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Identiske ledetekster" },
  })(instantsearch.widgets.rangeSlider)({
    container: "#identicalLabelCount",
    attribute: "identicalLabelCount",
    pips: false,
  }),
  instantsearch.widgets.panel({
    templates: { header: "Label-seksjoner med overskriftsnivå" },
  })(instantsearch.widgets.rangeSlider)({
    container: "#scLabelsWithHeadingCount",
    attribute: "scLabelsWithHeadingCount",
    pips: false,
  }),
  instantsearch.widgets.panel({
    templates: { header: "Expand-seksjoner med overskriftsnivå" },
  })(instantsearch.widgets.rangeSlider)({
    container: "#scExpandsWithHeadingCount",
    attribute: "scExpandsWithHeadingCount",
    pips: false,
  }),
  instantsearch.widgets.pagination({
    container: "#pagination",
  }),
]);

search.start();

/** Default dummy search by Algolia */
// const search = instantsearch({
//   indexName: "instant_search",
//   searchClient: algoliasearch("latency", "6be0576ff61c053d5f9a3225e2a90f76"),
// });

/** Optional proxy of search through our backend */
// const customSearchClient = {
//   search(requests) {
//     return fetch("http://localhost:3000/search", {
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ requests }),
//     }).then((res) => res.json());
//   },
//   searchForFacetValues(requests) {
//     return fetch("http://localhost:3000/sffv", {
//       method: "post",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ requests }),
//     }).then((res) => res.json());
//   },
// };
