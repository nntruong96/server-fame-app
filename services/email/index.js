const nodemailer = require('nodemailer');
const inlineBase64 = require('nodemailer-plugin-inline-base64');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const { OAuth2 } = google.auth;
const serverConfig = require('../../config/serverConfig');
const token = require('./token.json');
const Logger = require('../../Logger');
const logger = Logger.createWithDefaultConfig('services:email');

let smtpTransport;
let emailAccount;
let transportConfig;
const setPasswordEmailHTML = fs.readFileSync(
  path.join(__dirname, './PG_resetpassword.html'),
  'utf-8'
);

const sendVerifiedTokenEmailTemplate = fs.readFileSync(
  path.join(__dirname, './PG_mail_welcome.html'),
  'utf-8'
);

const welcomeEmailTemplate = fs.readFileSync(
  path.join(__dirname, './PG_validate_success.html'),
  'utf-8'
);

const resetPasswordSuccessEmailTemplate = fs.readFileSync(
  path.join(__dirname, './PG_mail_resetsucces.html'),
  'utf-8'
);

const getTransportConfigTest = async () => {
  emailAccount = await nodemailer.createTestAccount();
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: emailAccount.user,
      pass: emailAccount.pass,
    },
  };
};
async function createEmailAccount() {
  //   if (serverConfig.env.NODE_ENV === 'development') {
  //     transportConfig = await getTransportConfigTest();
  //   } else {

  try {
    const oauth2Client = new OAuth2(
      token.client_id,
      token.client_secret,
      token.redirect_uris[0]
    );
    oauth2Client.setCredentials({
      refresh_token: token.refresh_token,
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, _token) => {
        if (err) {
          return reject(err);
        }
        return resolve(_token);
      });
    });

    transportConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: token.user,
        accessToken,
        clientId: token.client_id,
        clientSecret: token.client_secret,
        refreshToken: token.refresh_token,
      },
    };
    emailAccount = {
      user: token.user,
    };
  } catch (err) {
    // console.log('createEmailAccount', err);
    logger.debug('Error', err);
    transportConfig = await getTransportConfigTest();
  }

  try {
    smtpTransport = nodemailer.createTransport(transportConfig);
    smtpTransport.use('compile', inlineBase64());
  } catch (err) {
    // console.log('createEmailAccount', err);
    logger.debug('Error', err);
  }
}

createEmailAccount().then(() => {
  logger.debug('email account', emailAccount);
  logger.debug('ready');
});

const sendEmail = async ({ receiverEmail, subject, html }) => {
  while (!emailAccount || !smtpTransport) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const mailOptions = {
    to: receiverEmail,
    from: `"Test App " <${emailAccount.user}>`,
    subject,
    html,
  };
  try {
    const info = await smtpTransport.sendMail(mailOptions);
    // Preview only available when sending through an Ethereal account
    if (nodemailer.getTestMessageUrl(info))
      logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.log('sendEmail', err);
    logger.debug('Error', err);
  }
};

const sendSetPasswordEmail = (name, setPasswordLink, email) => {
  return sendEmail({
    receiverEmail: email,
    subject: `Reset Your Password on Test App`,
    html: setPasswordEmailHTML
      .replace(/@NAME/, name)
      .replace(/@SET_PASSWORD_LINK/g, setPasswordLink),
  });
};

const sendVerifiedEmail = (verifiedLink, email) => {
  return sendEmail({
    receiverEmail: email,
    subject: `Test App account activation`,
    html: sendVerifiedTokenEmailTemplate.replace(
      /@VERIFIED_TOKEN_LINK/g,
      verifiedLink
    ),
  });
};

const sendResetPasswordSuccessEmail = (name, loginLink, email) => {
  return sendEmail({
    receiverEmail: email,
    subject: `Your Test App password has been successfully changed.`,
    html: resetPasswordSuccessEmailTemplate
      .replace(/@NAME/, name)
      .replace(/@LOGIN_LINK/g, loginLink),
  });
};

const sendWelcomeEmail = (email) => {
  return sendEmail({
    receiverEmail: email,
    subject: `Welcome to Test App!`,
    html: welcomeEmailTemplate,
  });
};

module.exports = {
  sendSetPasswordEmail,
  sendVerifiedEmail,
  sendWelcomeEmail,
  sendResetPasswordSuccessEmail,
};
