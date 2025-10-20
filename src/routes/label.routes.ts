import { Router } from 'express';
import { LabelController } from '../controllers/label.controller';

const router = Router();
const labelController = new LabelController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Label:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the label
 *         name:
 *           type: string
 *           description: The unique name of the label
 *         description:
 *           type: string
 *           description: The description of the label
 *         color:
 *           type: string
 *           description: The hex color code for the label
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LabelWithCounts:
 *       allOf:
 *         - $ref: '#/components/schemas/Label'
 *         - type: object
 *           properties:
 *             _count:
 *               type: object
 *               description: Count of related entities
 */

/**
 * @swagger
 * /api/admin/labels:
 *   get:
 *     summary: Get all labels with pagination and search
 *     tags: [Labels]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *     responses:
 *       200:
 *         description: List of labels with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LabelWithCounts'
 *                 pagination:
 *                   type: object
 */
router.get('/', labelController.getLabels.bind(labelController));

/**
 * @swagger
 * /api/admin/labels/statistics:
 *   get:
 *     summary: Get label usage statistics
 *     tags: [Labels]
 *     responses:
 *       200:
 *         description: Label statistics including usage counts
 */
router.get('/statistics', labelController.getLabelStatistics.bind(labelController));

/**
 * @swagger
 * /api/admin/labels/{id}:
 *   get:
 *     summary: Get label by ID
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label details with usage counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LabelWithCounts'
 *       404:
 *         description: Label not found
 */
router.get('/:id', labelController.getLabelById.bind(labelController));

/**
 * @swagger
 * /api/admin/labels:
 *   post:
 *     summary: Create a new label
 *     tags: [Labels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name for the label
 *               description:
 *                 type: string
 *                 description: Description of the label
 *               color:
 *                 type: string
 *                 description: Hex color code (default #007bff)
 *     responses:
 *       201:
 *         description: Label created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Label'
 *                 message:
 *                   type: string
 *       409:
 *         description: Label name already exists
 */
router.post('/', labelController.createLabel.bind(labelController));

/**
 * @swagger
 * /api/admin/labels/{id}:
 *   put:
 *     summary: Update a label
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the label
 *               description:
 *                 type: string
 *                 description: Description of the label
 *               color:
 *                 type: string
 *                 description: Hex color code
 *     responses:
 *       200:
 *         description: Label updated successfully
 *       404:
 *         description: Label not found
 *       409:
 *         description: Label name already exists
 */
router.put('/:id', labelController.updateLabel.bind(labelController));

/**
 * @swagger
 * /api/admin/labels/{id}:
 *   delete:
 *     summary: Delete a label
 *     tags: [Labels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label deleted successfully
 *       400:
 *         description: Cannot delete label that is in use
 *       404:
 *         description: Label not found
 */
router.delete('/:id', labelController.deleteLabel.bind(labelController));

/**
 * @swagger
 * /api/admin/labels/bulk-delete:
 *   post:
 *     summary: Bulk delete all data associated with specific label names
 *     tags: [Labels]
 *     description: |
 *       **WARNING: This is a destructive operation that will permanently delete ALL data
 *       associated with the specified label names across ALL tables.**
 *
 *       This operation will delete:
 *       - All users, roles, permissions with the specified labels
 *       - All AI agents, conversations, messages with the specified labels
 *       - All login/logic history, tokens, SSO entries with the specified labels
 *       - All mail templates, notifications, configs with the specified labels
 *       - All API keys and usage logs with the specified labels
 *
 *       Use this carefully, typically for cleaning up test/mock data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - labelNames
 *               - confirm
 *             properties:
 *               labelNames:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of label names to delete data for
 *                 example: ["mock", "temporary"]
 *               confirm:
 *                 type: boolean
 *                 description: Must be true to confirm this destructive operation
 *                 example: true
 *     responses:
 *       200:
 *         description: Bulk deletion completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedLabels:
 *                   type: array
 *                   items:
 *                     type: string
 *                 deletionBreakdown:
 *                   type: object
 *                   description: Count of deleted records by table
 *                 totalDeleted:
 *                   type: integer
 *       400:
 *         description: Invalid request or confirmation required
 *       404:
 *         description: No labels found with specified names
 */
router.post('/bulk-delete', labelController.bulkDeleteByLabelNames.bind(labelController));

export default router;
