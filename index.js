import express from "express";
import ejs from "ejs";
import { runLighthouse } from "./uu.js";
import { saveBlob } from "./db.js";

console.debug("Setting up server");

const Express = express;
const router = Express.Router();

router.get("/", async (req, res) => {
  res.render("index", { title: "uuoversiktlig" });
});

router.post("/run", async (req, res) => {
  const url = req.body.url || "https://www.google.com";

  const result = await runLighthouse(url);

  const id = url.split("://")[1];
  var blobUrl = await saveBlob(id, JSON.stringify(result.lhr));

  res.send({
    url,
    score: result.lhr.categories.accessibility.score,
    blobUrl,
  });
  res.end();
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
