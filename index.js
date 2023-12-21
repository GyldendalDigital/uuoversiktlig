import express from "express";
import ejs from "ejs";
import { runLighthouse } from "./uu.js";
import { saveBlob } from "./blobStorage.js";
import { saveRecords, searchFacets, searchRecords } from "./searchClient.js";

console.debug("Setting up server");

const Express = express;
const router = Express.Router();

router.get("/", async (req, res) => {
  res.render("search", {
    title: "uuoversiktlig",
    subtitle: "Finn UU-testa sider",
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME,
    ALGOLIA_API_KEY_FRONTEND: process.env.ALGOLIA_API_KEY_FRONTEND,
  });
});

router.get("/test", async (req, res) => {
  res.render("manual-url-test", {
    title: "uuoversiktlig",
    subtitle: "UU-test en side",
  });
});

router.post("/run", async (req, res) => {
  if (!req.body.url || !req.body.url.includes("://")) {
    res.status(400).send("Invalid URL");
    return;
  }

  const url = (req.body.url || "https://www.google.com").replace(/\/$/, "");

  const { title, totalScore, failingAudits, result } = await runLighthouse(url);

  const id = url.split("://")[1].replaceAll("/", "-");

  const jsonUrl = await saveBlob(id, JSON.stringify(result.lhr));

  const record = {
    objectID: id,
    title,
    totalScore,
    failingAudits,
    url,
    jsonUrl,
  };

  await saveRecords([record]);

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
console.debug("Listening on http://localhost:" + port);
server.listen(port);
