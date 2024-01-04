import express from "express";
import ejs from "ejs";
import { searchFacets, searchRecords } from "./searchClient.js";
import { runUrl } from "./runUrl.js";
import { subscribeToMessages } from "./serviceBus.js";
import { logger } from "./utils.js";

const Express = express;
const router = Express.Router();
const log = logger("Server").log;

router.get("/", async (req, res) => {
  res.render("search", {
    title: "uuoversiktlig",
    subtitle: "Let fram (u)utilgjengelige sider",
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME,
    ALGOLIA_API_KEY_FRONTEND: process.env.ALGOLIA_API_KEY_FRONTEND,
  });
});

router.get("/test", async (req, res) => {
  res.render("manual-url-test", {
    title: "uuoversiktlig",
    subtitle: "Sjekk (u)utilgjengeligheten på en side",
    url: req.query.url,
  });
});

router.post("/run", async (req, res) => {
  if (!req.body.url || !req.body.url.includes("://")) {
    res.status(400).send("Invalid URL");
    return;
  }

  const record = await runUrl(req.body.url);

  res.send(record);
  res.end();
});

/** Optional proxy of search through our backend */
router.post("/search", async ({ body }, res) => {
  const { requests } = body;
  const results = await searchRecords(requests);
  res.status(200).send(results);
});

/** Optional proxy of search through our backend */
router.post("/sffv", async ({ body }, res) => {
  const { requests } = body;
  const results = await searchFacets(requests);
  res.status(200).send(results);
});

const server = Express();

server.engine(".html", ejs.renderFile);
server.set("view engine", "html");
server.use(express.static("public"));

server.use(express.json());
server.use(router);

const port = process.env.PORT || 3000;
server.listen(port);
log("listening on http://localhost:" + port);

subscribeToMessages();
