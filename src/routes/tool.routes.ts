import { Router } from 'express';
import {
  listTools,
  getTool,
  getToolWithAgents,
  createTool,
  updateTool,
  deleteTool,
  enableTool,
  disableTool,
  toggleTool,
  listAgentTools,
  getEnabledTools,
  getDisabledTools,
  countAgentTools,
  enableAllTools,
  disableAllTools,
  searchToolsByName,
  getToolsByType,
  getGlobalTools,
  deleteAgentTools,
  hasToolForAgent,
} from '../controllers/tool.controller';

const router = Router();

// ==================== GENERAL TOOL ROUTES ====================

/**
 * GET /api/tools
 * List all tools (optionally filtered by agentId query param)
 * Query params: ?agentId=xxx
 */
router.get('/', searchToolsByName);

/**
 * POST /api/tools
 * Create a new tool
 */
router.post('/', createTool);

/**
 * GET /api/tools/search
 * Search tools by name (partial matching)
 * Query params: ?name=xxx
 */
router.get('/search', searchToolsByName);

/**
 * GET /api/tools/global
 * Get all global tools (not associated with any agent)
 */
router.get('/global', getGlobalTools);

/**
 * GET /api/tools/type/:type
 * Get tools by type
 */
router.get('/type/:type', getToolsByType);

/**
 * GET /api/tools/:id/with-agents
 * Get a single tool by ID with all related agents
 */
router.get('/:id/with-agents', getToolWithAgents);

/**
 * GET /api/tools/:id
 * Get a single tool by ID
 */
router.get('/:id', getTool);

/**
 * PUT /api/tools/:id
 * Update a tool by ID
 */
router.put('/:id', updateTool);

/**
 * DELETE /api/tools/:id
 * Delete a tool by ID
 */
router.delete('/:id', deleteTool);

// ==================== AGENT-SPECIFIC TOOL ROUTES ====================

/**
 * GET /api/tools/agent/:agentId
 * List all tools for a specific agent
 */
router.get('/agent/:agentId', listAgentTools);

/**
 * DELETE /api/tools/agent/:agentId
 * Delete all tools for a specific agent
 */
router.delete('/agent/:agentId', deleteAgentTools);

/**
 * GET /api/tools/agent/:agentId/enabled
 * Get all enabled tools for an agent
 */
router.get('/agent/:agentId/enabled', getEnabledTools);

/**
 * GET /api/tools/agent/:agentId/disabled
 * Get all disabled tools for an agent
 */
router.get('/agent/:agentId/disabled', getDisabledTools);

/**
 * GET /api/tools/agent/:agentId/count
 * Count tools for an agent
 * Query params: ?enabledOnly=true
 */
router.get('/agent/:agentId/count', countAgentTools);

/**
 * GET /api/tools/agent/:agentId/has/:name
 * Check if a tool exists for an agent
 */
router.get('/agent/:agentId/has/:name', hasToolForAgent);

/**
 * PUT /api/tools/agent/:agentId/enable/:name
 * Enable a specific tool for an agent
 */
router.put('/agent/:agentId/enable/:name', enableTool);

/**
 * PUT /api/tools/agent/:agentId/disable/:name
 * Disable a specific tool for an agent
 */
router.put('/agent/:agentId/disable/:name', disableTool);

/**
 * PUT /api/tools/agent/:agentId/toggle/:name
 * Toggle tool enabled status for an agent
 */
router.put('/agent/:agentId/toggle/:name', toggleTool);

/**
 * PUT /api/tools/agent/:agentId/enable-all
 * Enable all tools for an agent
 */
router.put('/agent/:agentId/enable-all', enableAllTools);

/**
 * PUT /api/tools/agent/:agentId/disable-all
 * Disable all tools for an agent
 */
router.put('/agent/:agentId/disable-all', disableAllTools);

export default router;
