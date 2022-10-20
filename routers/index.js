// The content of this file was generated by IBM Cloud
// Do not modify it as it might get overridden
const constants = require('./constants');
const authRoute = require('./routes/auth');
// const tripRoute = require('./routes/trip');
const userRoute = require('./routes/user');
const usersRoute = require('./routes/users');
const postRoute = require('./routes/posts');
const conversationRoute = require('./routes/conversations');
const messageRoute = require('./routes/messages');
module.exports = (app) => {
  app.use(`${constants.baseApi}/auth`, authRoute);
  // app.use(`${constants.baseApi}`, tripRoute);
  app.use(`${constants.baseApi}`, userRoute);
  app.use(`${constants.baseApi}/users`, usersRoute);
  app.use(`${constants.baseApi}/posts`, postRoute);
  app.use(`${constants.baseApi}/conversations`, conversationRoute);
  app.use(`${constants.baseApi}/messages`, messageRoute);
  // catches all next(new Error()) from previous rules, you can set res.status() before you call next(new Error())
  // eslint-disable-next-line
  require('./public')(app);
};
