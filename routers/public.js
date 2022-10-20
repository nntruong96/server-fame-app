const express = require('express');
const path = require('path');
const serverConfig = require('../config/serverConfig');
const { renderPage } = require('./routes/utils');

module.exports = (app) => {
  app.use('/images', express.static(path.join(__dirname, '../public/images')));
  // App
  app.use(
    '/app/static',
    express.static(`${serverConfig.clientDir}/static`, { maxAge: '1y' })
  );
  app.get(
    '/static',
    express.static(`${serverConfig.clientDir}/static`, { maxAge: '1y' })
  );
  app.get(
    '/favicon.ico',
    express.static(`${serverConfig.clientDir}/favicon.ico`, { maxAge: '1y' })
  );
  app.get(
    '/manifest.jcon',
    express.static(`${serverConfig.clientDir}/manifest.json`, { maxAge: '1y' })
  );
  app.use('/app/images', express.static(`${serverConfig.clientDir}/images`));
  app.use('/ratings', express.static(`${serverConfig.clientDir}/ratings`));
  app.use(
    [
      '/app',
      '/app*',
      '/auth*',
      //   '/trip*',
      //   '/settings',
      //   '/profile',
      //   '/grading',
      //   '/questions',
      //   '/meeting-merit',
      //   '/tips',
      //   '/users',
      //   '/dashboard',
      //   '/welcome-aboard',
    ],
    express.static(serverConfig.clientDir)
  );

  // ./. App
  // app.use(
  //   '/static',
  //   express.static(`${serverConfig.landingPage}/static`, { maxAge: '1y' })
  // );
  app.use('/', express.static(serverConfig.clientDir));
  // eslint-disable-next-line no-unused-vars
  app.get('/', (req, res, next) => {
    return renderPage(req, res);
  });
};
