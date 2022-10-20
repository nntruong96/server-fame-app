const fs = require('fs');
const path = require('path');
require('dotenv').config();

const privateKey = fs.readFileSync(
  path.join(__dirname, '../routers/middlewares/auth/PRIVATE_KEY'),
  'utf8'
);
const publicKey = fs.readFileSync(
  path.join(__dirname, '../routers/middlewares/auth/PUBLIC_KEY'),
  'utf8'
);
module.exports = {
  env: process.env,
  authentication: {
    salts: 10,
    jwt: {
      long: {
        expiresIn: 60 * 60 * 24 * 365, // 365 days
        renewBeforeExpires: 60 * 60 * 24 * 30, // 30 days
      },
      short: {
        // expiresIn: 60 * 60 * 4, // 4 hours
        // renewBeforeExpires: 60 * 60, // 1 hour
        expiresIn: 60 * 60 * 24 * 365, // 365 days
        renewBeforeExpires: 60 * 60 * 24 * 30, // 30 days
      },
      cookieId: 'access_token',
      algorithm: 'RS256',
      privateKey,
      publicKey,
    },
  },
  clientDir: path.join(__dirname, '../build'),
  landingPage: path.join(__dirname, '../landing-page/build'),
  dbName: 'chatapp2',
  siteAdminEmails: [{ email: 'nhuttruong6496@gmail.com' }],
  teacherDefaultEmail: ['nhuttruong6496@gmail.com'],
  server: {
    log: {
      transports: [
        {
          transportType: 'Console',
          options: {
            name: 'console',
            level: 'debug',
            colorize: true,
            timestamp: true,
            prettyPrint: true,
            handleExceptions: true, // ignored by default when you create the logger,
            // see the logger.create function
            depth: 2,
          },
        },
        {
          transportType: 'File',
          options: {
            name: 'info-file',
            filename: './server-info.log',
            level: 'info',
            json: false,
          },
        },
        {
          transportType: 'File',
          options: {
            name: 'debug-file',
            filename: './server-debug.log',
            level: 'debug',
            json: false,
          },
        },
        {
          transportType: 'File',
          options: {
            name: 'warn-file',
            filename: './server-warn.log',
            level: 'warn',
            json: false,
          },
        },
        {
          transportType: 'File',
          options: {
            name: 'error-file',
            filename: './server-error.log',
            level: 'error',
            handleExceptions: true, // ignored by default when you create the logger,
            // see the logger.create function
            json: false,
          },
        },
      ],
    },
  },
};
