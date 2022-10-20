const swaggerJSDoc = require('swagger-jsdoc');
const serverConfig = require('./config/serverConfig');

const hostname = serverConfig.env.HOST || 'localhost';

const swaggerSpec = (params) => {
  const host = `${hostname}${params.port ? `:${params.port}` : ''}`;
  // swagger definition
  const swaggerDefinition = {
    info: {
      title: 'Test App',
      version: '1.0.0',
      description: 'Test App application API with Swagger',
    },
    host,
    basePath: '/',
  };

  // options for the swagger docs
  const options = {
    // import swaggerDefinitions
    swaggerDefinition,
    // path to the API docs
    apis: [
      `./db/models/*.js`,
      `./routers/controllers/*.js`,
      `./routers/routes/*.js`,
    ],
  };

  // initialize swagger-jsdoc
  return swaggerJSDoc(options);
};

module.exports = swaggerSpec;
