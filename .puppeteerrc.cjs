const { join } = require("path");
/**
 * https://azureossd.github.io/2023/05/05/Running-Puppeteer-on-Azure-App-Service-Linux/
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, 'cache', 'puppeteer'),
};
