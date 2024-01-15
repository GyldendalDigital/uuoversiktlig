import express from "express";
import ejs from "ejs";
import { runUrl } from "./e2e/main.js";
import { subscribeToMessages } from "./e2e/services/serviceBus.js";
import { logger } from "./e2e/utils.js";

const Express = express;
const router = Express.Router();
const log = logger("Api").log;

const searchMetadata = () => ({
  title: "uuoversiktlig",
  subtitle: "Automatisk testing av publiserte aktiviteter i Redaptic.",
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
  ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME_FRONTEND,
  ALGOLIA_API_KEY_FRONTEND: process.env.ALGOLIA_API_KEY_FRONTEND,
});

router.get("/", async (_req, res) => {
  res.render("search", searchMetadata());
});

router.get("/developer", async (_req, res) => {
  res.render("search-developer", {
    ...searchMetadata(),
    subtitle: "Utviklersøk for indekserte sider med tilhørende Lighthouse-rapporter.",
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
