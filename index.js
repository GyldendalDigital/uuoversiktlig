import express from "express";
import { launch } from "puppeteer";
import lighthouse from "lighthouse";
import ejs from "ejs";
import {
  userAgents,
  screenEmulationMetrics,
} from "lighthouse/core/config/constants.js";

const Express = express;

const router = Express.Router();

router.get("/", async (req, res) => {
  res.render("index", { title: "Express" });
});

/** @type {import("lighthouse/types/config").default} */
const config = {
  extends: "lighthouse:default",
  settings: {
    output: "html",
    onlyCategories: ["accessibility"],
    formFactor: "desktop",
    screenEmulation: screenEmulationMetrics.desktop,
    emulatedUserAgent: userAgents.desktop,
    skipAudits: [
      "td-has-header",
      "table-fake-caption",
      "label-content-name-mismatch",
    ],
  },
};

router.get("/run", async (req, res) => {
  console.log("starter");

  const browser = await launch({
    headless: "new",
  });

  const page = await browser.newPage();

  const result = await lighthouse(
    "https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs?tabs=linux&pivots=development-environment-cli",
    { disableStorageReset: true },
    config,
    page
  );

  console.log("r", result.lhr.categories.accessibility.score);

  res.send("Hello World");
  res.end();
});

const server = Express();
server.engine(".html", ejs.renderFile);
server.set("view engine", "html");
server.use(express.static("public"));
server.use(router);
server.listen(process.env.PORT || 3000);

export default server;