import express from "express";
import ejs from "ejs";
import { runLighthouse } from "./uu.js";
import { saveBlob } from "./blobStorage.js";
import { saveRecords, searchFacets, searchRecords } from "./searchClient.js";

console.debug("Setting up server");

const Express = express;
const router = Express.Router();

router.get("/", async (req, res) => {
  res.render("index", { title: "uuoversiktlig" });
});

router.post("/run", async (req, res) => {
  if (!req.body.url || !req.body.url.includes("://")) {
    res.status(400).send("Invalid URL");
    return;
  }

  const url = (req.body.url || "https://www.google.com").replace(/\/$/, "");

  const { title, totalScore, result } = await runLighthouse(url);

  const id = url.split("://")[1].replaceAll("/", "-");

  const jsonUrl = await saveBlob(id, JSON.stringify(result.lhr));

  const record = {
    objectID: id,
    title,
    totalScore,
    url,
    jsonUrl,
  };

  await saveRecords([record]);

  res.send(record);
  res.end();
});

router.post("/search", async ({ body }, res) => {
  const { requests } = body;
  const results = await searchRecords(requests);
  res.status(200).send(results);
});

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
