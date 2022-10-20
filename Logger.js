/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-spread */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/**
 * example usage
 * create('moduleName', config.server.log);
 *
 * Log debug messages to the console
 * Notes:
 *  - it overwrites only the winston console transport log level to info
 *  - debug patterns are not applied to any additional transports file or database
 *  - logger.debug() logs to all transports except the console and uses the 'debug' library instead of console transport
 *  - all other transports and log levels are logged according to the configuration
 *
 *
 * @module Server:Logger
 */

const winston = require('winston');
const config = require('./config/serverConfig');

let Logger;
let mainLogger;
let logger;
const loggers = {};
let globalPatterns = ['*']; // log everything by default

function generateName() {
  return Math.random().toString(36).slice(2, 15);
}

function isEnabled(name, patterns) {
  const len = patterns.length;
  let shouldSkip = false;
  let shouldInclude = false;
  let pattern;
  let j;

  for (j = 0; j < len; j += 1) {
    if (patterns[j] === '') {
      // ignore empty strings
      // eslint-disable-next-line no-continue
      continue;
    }
    pattern = patterns[j].replace(/\*/g, '.*?');
    if (pattern[0] === '-') {
      shouldSkip =
        shouldSkip || new RegExp(`^${pattern.substr(1)}$`).test(name);
    } else {
      shouldInclude = shouldInclude || new RegExp(`^${pattern}$`).test(name);
    }
  }

  return shouldInclude && shouldSkip === false;
}

function createLogger(name, options) {
  const winstonOptions = { transports: [] };
  let transport;
  let i;

  if (!mainLogger) {
    if (!options) {
      throw new Error('options is a mandatory parameter.');
    }

    if (!options.transports) {
      throw new Error('options.transports is a mandatory parameter.');
    }

    globalPatterns = options.patterns || globalPatterns;

    // FIXME: transport specific patterns
    for (i = 0; i < options.transports.length; i += 1) {
      transport = new winston.transports[options.transports[i].transportType](
        options.transports[i].options
      );
      if (
        options.transports[i].transportType.toLocaleLowerCase() === 'console'
      ) {
        transport.level = 'info';
      }
      winstonOptions.transports.push(transport);
    }

    // create a single logger if it does not exist
    mainLogger = winston.loggers.add('chat', winstonOptions);
    logger = createLogger('chat:logger');
  }

  // eslint-disable-next-line no-prototype-builtins
  if (loggers.hasOwnProperty(name)) {
    return loggers[name];
  }

  const newLogger = new Logger(name);
  newLogger.enable(isEnabled(name, globalPatterns));
  loggers[name] = newLogger;

  if (logger) {
    logger.debug(`Created new logger ${name}`);
  }

  return newLogger;
}

function createWithDefaultConfig(name) {
  return createLogger(name, config.server.log, true);
}

Logger = function (name) {
  this.name = name || generateName();
  this.enabled = true;
};

Logger.prototype.debug = function () {
  let args;
  if (this.enabled) {
    args = this._addNameToLogMessage.apply(this, arguments);
    mainLogger.debug.apply(this, args);
  }
};

Logger.prototype.info = function () {
  let args;
  if (this.enabled) {
    args = this._addNameToLogMessage.apply(this, arguments);
    mainLogger.info.apply(this, args);
  }
};

Logger.prototype.log = function () {
  throw new Error('Call debug, info, warn or error functions.');
};

Logger.prototype.warn = function () {
  let args;
  if (this.enabled) {
    args = this._addNameToLogMessage.apply(this, arguments);
    mainLogger.warn.apply(this, args);
  }
};

Logger.prototype.error = function () {
  let args;
  if (this.enabled) {
    args = this._addNameToLogMessage.apply(this, arguments);
    mainLogger.error.apply(this, args);
  }
};

Logger.prototype.enable = function (enable) {
  this.enabled = enable === true;
};

Logger.prototype.fork = function (forkName, useForkName) {
  // eslint-disable-next-line no-param-reassign, prefer-template
  forkName = useForkName ? forkName : this.name + ':' + forkName;
  return createLogger(forkName);
};

// TODO: add close function

Logger.prototype._addNameToLogMessage = function () {
  if (arguments[0]) {
    arguments[0] = `[${this.name}] ${arguments[0]}`;
  } else {
    arguments[0] = `[${this.name}]`;
  }
  return arguments;
};

module.exports = {
  create: createLogger,
  createWithDefaultConfig,
};
