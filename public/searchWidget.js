/* global instantsearch algoliasearch ALGOLIA_APP_ID ALGOLIA_INDEX_NAME ALGOLIA_API_KEY_FRONTEND */

/** Query Algolia directly (exposes app id and read-only api key) */
const defaultClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY_FRONTEND);

const search = instantsearch({
  indexName: ALGOLIA_INDEX_NAME,
  searchClient: defaultClient,
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
  }),
  instantsearch.widgets.hits({
    container: "#hits",
    templates: {
      item: (hit, { html, components }) => html`
        <article>
          <h3>${hit.title}</h3>
          <p>${hit.url}</p>
          <p>Score: ${hit.totalScore * 100}%</p>
          <a
            href="https://googlechrome.github.io/lighthouse/viewer/?jsonurl=${hit.jsonUrl}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vis rapport
          </a>
        </article>
      `,
    },
  }),
  // instantsearch.widgets.configure({
  //   hitsPerPage: 8,
  // }),
  instantsearch.widgets.panel({
    templates: { header: "Anmerkninger" },
  })(instantsearch.widgets.refinementList)({
    container: "#audits",
    attribute: "failingAudits.title",
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
