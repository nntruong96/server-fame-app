const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const responseTime = require('response-time');
const serverConfig = require('./config/serverConfig');
const swaggerDocument = require('./swaggerSpec');

const addSiteAdmins = require('./bin/addSiteAdmin');
const routers = require('./routers');
const socket = require('./socket/index');
const app = express();
const server = http.createServer(app);
const Logger = require('./Logger');

const logger = Logger.createWithDefaultConfig('server');

app.use(
  responseTime((req, _, time) => {
    logger.info(
      `${req.ip} - ${req.method} ${req.originalUrl} ${req.protocol} - ${time}`
    );
  })
);

app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  res.json({
    error_message: 'Body should be a JSON',
  });
});
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(methodOverride());

const mongoURL = serverConfig.env.MONGO_URL || 'mongodb://localhost:27017/chat';

async function start(params) {
  let success = false;
  // Try connecting to MongoDB server
  while (!success) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await mongoose.connect(mongoURL);
      success = true;
    } catch (err) {
      logger.debug('Error connecting to MongoDB, retrying in 1 second');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  logger.info('MongoDB initialized');
  // Auto generate API resources with Swagger UI lib
  if (process.env.GENERATE_API_DOCS) {
    app.use(
      `/api-docs/`,
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument(params))
    );
  }

  routers(app);
  // Populate DB with default value
  await addSiteAdmins();
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.json({
      error_code: err.error_code || err.message,
      error_message: err.message,
      error_data: err.error_data,
    });
  });
  const _server = server.listen(params.port || 80, () => {
    logger.info(
      `Listening on http://localhost${params.port ? `:${params.port}` : ''}`
    );
    if (params && params.done) params.done();
  });
  socket(_server);
}

module.exports = {
  start,
  stop: (done) => {
    server.close(done);
  },
};
