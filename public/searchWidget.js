/* global instantsearch algoliasearch */

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

/** Query Algolia directly (exposes app id and read-onyl api key) */
const defaultClient = algoliasearch(
  "2B11ICS5B4",
  "609b91af0e563b3e211533b1a372f02a"
);

const search = instantsearch({
  indexName: "uutest",
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
        </article>
      `,
    },
  }),
  // instantsearch.widgets.configure({
  //   hitsPerPage: 8,
  // }),
  // instantsearch.widgets.panel({
  //   templates: { header: "brand" },
  // })(instantsearch.widgets.refinementList)({
  //   container: "#brand-list",
  //   attribute: "brand",
  // }),
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
