const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth');

/**
 * @swagger
 * /api/v1/auth/login/:
 *   post:
 *     tags:
 *       - Authentication
 *     description: user login endpoint
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: User object
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *                  password:
 *                     type: string
 *     responses:
 *       200:
 *         description: successful!
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/register/:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Register new user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: User object
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *                  password:
 *                     type: string
 *     responses:
 *       200:
 *         description: successful!
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/forgot/:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Send email to reset password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: Email
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *     responses:
 *       200:
 *         description: successful!
 *       400:
 *          description: Err!
 */
router.post('/forgot', authController.forgotPassword);
/**
 * @swagger
 * /api/v1/auth/reset/:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Send password and token to reset password.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: Data
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *                  password:
 *                     type: string
 *                  token:
 *                     type: string
 *
 *     responses:
 *       200:
 *         description: successful!
 *       400:
 *          description: Err!
 */
router.route('/reset').post(authController.resetPassword);

/**
 * @swagger
 * /api/v1/auth/verify-forgot-token/:
 *  post:
 *    tags:
 *        - Authentication
 *    description: verify forgot token
 *    produces:
 *       - application/json
 *    parameters:
 *       - name: Data
 *         description: Data
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *                  token:
 *                     type: string
 *    responses:
 *      200:
 *         description: successful!
 *      400:
 *         description: Err!
 */
router.post('/verify-forgot-token', authController.verifyForgotPasswordToken);

/**
 * @swagger
 * /api/v1/auth/confirmation/{token}:
 *   get:
 *     tags:
 *       - Authentication
 *     description: Send token.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: token
 *         in: path
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  token:
 *                     type: string
 *     responses:
 *       200:
 *         description: successful!
 *       400:
 *          description: Err!
 */
router.get('/confirmation/:token', authController.verifyAccount);

/**
 * @swagger
 * /api/v1/auth/resend:
 *   post:
 *     tags:
 *       - Authentication
 *     description: Send userId to resend email.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: user
 *         description: userId
 *         in: body
 *         required: true
 *         schema:
 *             type: object
 *             properties:
 *                  email:
 *                     type: string
 *     responses:
 *       200:
 *         description: successful!
 *       400:
 *          description: Err!
 */
router.post('/resend', authController.resend);

router.post('/logout', authController.logout);

router.use(authController.ensureAuthenticated);

module.exports = router;
