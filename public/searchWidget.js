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
              Score: ${hit.lighthouseTotalScore ? " " + hit.lighthouseTotalScore * 100 : null}% ${" "}
              <a
                href="https://googlechrome.github.io/lighthouse/viewer/?jsonurl=${hit.jsonUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vis rapport
              </a>
            </p>
            <p>${hit.identicalLabelCount} identiske ledetekster</p>
            <p>${hit.h3} H1</p>
            <p>${hit.h4} H2</p>
            <p>${hit.scLabelsWithHeadingCount} Label-seksjoner med overskriftsnivå</p>
            <p>${hit.scExpandsWithHeadingCount} Expand-seksjoner med overskriftsnivå</p>
            <p>
              ${hit.learningMaterials ? ` ${hit.learningMaterials.join(", ")} ` : null}
              ${hit.subjects ? `${hit.subjects.join(", ")} ` : null} ${hit.grades ? `${hit.grades.join(", ")} ` : null}
            </p>
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
    container: "#learning-materials",
    attribute: "learningMaterials",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Fag" },
  })(instantsearch.widgets.refinementList)({
    container: "#subjects",
    attribute: "subjects",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Trinn" },
  })(instantsearch.widgets.refinementList)({
    container: "#grades",
    attribute: "grades",
  }),
  instantsearch.widgets.panel({
    templates: { header: "Anmerkninger" },
  })(instantsearch.widgets.refinementList)({
    container: "#audits",
    attribute: "lighthouseFailingAudits.title",
  }),
  // instantsearch.widgets.pagination({
  //   container: "#pagination",
  // }),
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
