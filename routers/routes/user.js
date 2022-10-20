const express = require('express');

const router = express.Router();
const authController = require('../controllers/auth');
const userController = require('../controllers/user');
const multerParser = require('../middlewares/multerParser');
router.use(authController.ensureAuthenticated);

router
  .route('/user/')
  /**
   * @swagger
   * /api/v1/user/:
   *  get:
   *    tags:
   *      - Users
   *    description: Get user's information.
   *    produces:
   *      - application/json
   *    responses:
   *       200:
   *         description: successful!
   */
  .get(userController.get)
  /**
   * @swagger
   * /api/v1/user/:
   *  put:
   *    tags:
   *      - Users
   *    description: Update user data / change password.
   *    summary: Update user data / change password.
   *    produces:
   *      - application/json
   *    parameters:
   *      - name: body
   *        in: body
   *        schema:
   *          type: object
   *          description: properties belong to user
   *          properties:
   *            currentPassword:
   *              type: string
   *              description: it's required when user want to change their password
   *            password:
   *              type: string
   *            phone:
   *              type: string
   *            role:
   *              type: number
   *              enum:
   *                - 0
   *                - 1
   *            firstName:
   *              type: string
   *            lastName:
   *              type: string
   *    responses:
   *       200:
   *         description: successful!
   *         schema:
   *           type: object
   *           properties:
   *             error_code:
   *               type: number
   *             error_message:
   *               type: string
   *             data:
   *               type: object
   *               $ref: '#/definitions/User'
   */
  .put(multerParser.single('avatar'), userController.update)
  /**
   * @swagger
   * /api/v1/user/:
   *  delete:
   *    tags:
   *      - Users
   *    description: Delete user
   *    produces:
   *      - application/json
   *    responses:
   *       200:
   *         description: successful!
   */
  .delete(userController.delete);

// Manage User API
/**
 * @swagger
 * tags:
 *   - name: "Manage users"
 *     description: "This api provide for admin"
 */

router
  .route('/profile/:id')
  /**
   * @swagger
   * /api/v1/profile/{userId}:
   *  get:
   *    tags:
   *      - Manage users
   *    description: Get user by id
   *    summary: Get user by id
   *    produces:
   *      - application/json
   *    parameters:
   *      - name: userId
   *        in: path
   *    responses:
   *      200:
   *        description: successful!
   *        schema:
   *          type: object
   *          properties:
   *            error_code:
   *              type: number
   *            error_message:
   *              type: string
   *            data:
   *              type: object
   *              $ref: '#/definitions/User'
   */
  .get(userController.getUserById)
  /**
   * @swagger
   * /api/v1/profile/{userId}:
   *  put:
   *    tags:
   *      - Manage users
   *    description: Update user data by userId.
   *    summary: Update user data by userId.
   *    produces:
   *      - application/json
   *    parameters:
   *      - name: userId
   *        in: path
   *      - name: body
   *        in: body
   *        schema:
   *          type: object
   *          description: properties belong to user
   *          properties:
   *            phone:
   *              type: string
   *            role:
   *              type: number
   *              enum:
   *                - 0
   *                - 1
   *            firstName:
   *              type: string
   *            lastName:
   *              type: string
   *    responses:
   *       200:
   *         description: successful!
   *         schema:
   *           type: object
   *           properties:
   *             error_code:
   *               type: number
   *             error_message:
   *               type: string
   *             data:
   *               type: object
   *               $ref: '#/definitions/User'
   */
  .put(userController.updateUserById)
  /**
   * @swagger
   * /api/v1/users/{userId}:
   *  delete:
   *    tags:
   *      - Manage users
   *    description: Delete user by id
   *    summary: Delete user by id
   *    produces:
   *      - application/json
   *    parameters:
   *      - name: userId
   *        in: path
   *    responses:
   *      200:
   *        description: successful!
   *        schema:
   *          type: object
   *          properties:
   *            error_code:
   *              type: number
   *            error_message:
   *              type: string
   *            data:
   *              type: object
   */
  .delete(userController.deleteUserById);

module.exports = router;
