const fs = require('fs');

const serverConfig = require('../../../config/serverConfig');

function renderPage(_, res) {
  try {
    const indexHtmlPath = `${serverConfig.clientDir}/index.html`;
    const indexTemp = fs.readFileSync(indexHtmlPath, 'utf8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(indexTemp);
  } catch (err) {
    console.log(err);
    res.sendStatus(404);
  }
}

module.exports = { renderPage };
