/**
 * AcademicFlow MCP Server — Entry Point
 *
 * Serves the AcademicFlow MCP tools over Streamable HTTP (POST /mcp).
 * Uses the MCP v2 SDK with the Express adapter.
 *
 * Architecture:
 *   AI Client → MCP + Bearer Auth → AcademicFlow MCP Server → Supabase (via RLS)
 *
 * The server authenticates every MCP request via a Supabase access token
 * carried as a Bearer token. The user identity is resolved server-side;
 * tool arguments cannot override identity.
 */
import 'dotenv/config';
import express from 'express';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { verifyAccessToken, type AuthContext } from './auth.js';
import { registerProfileTools } from './tools/profile.js';
import { registerAcademicTools } from './tools/academics.js';
import { registerAttendanceTools } from './tools/attendance.js';
import { registerAchievementTools } from './tools/achievements.js';
import { registerDocumentTools } from './tools/documents.js';
import { registerAnalysisTools } from './tools/analysis.js';

const PORT = parseInt(process.env['MCP_PORT'] ?? '3001', 10);

// ─── MCP Handler ────────────────────────────────────────────────────────────
// The factory receives the request context. We extract the Bearer token from
// the Authorization header and verify it against Supabase Auth.
// A fresh McpServer is built per request, scoped to the authenticated user.

const handler = createMcpHandler(async ({ requestInfo }) => {
  const server = new McpServer({
    name: 'academicflow-mcp',
    version: '1.0.0',
  });

  // Extract auth from the inbound request
  let auth: AuthContext | null = null;

  if (requestInfo) {
    const authHeader = requestInfo.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        auth = await verifyAccessToken(token);
      } catch {
        // Auth failed — tools will still be listed but will return errors
        auth = null;
      }
    }
  }

  // Register all tools. Each tool checks auth internally and returns
  // appropriate errors if the user is not authenticated.
  if (auth) {
    registerProfileTools(server, auth);
    registerAcademicTools(server, auth);
    registerAttendanceTools(server, auth);
    registerAchievementTools(server, auth);
    registerDocumentTools(server, auth);
    registerAnalysisTools(server, auth);
  } else {
    // Register a single informational tool for unauthenticated requests
    server.registerTool(
      'authenticate',
      {
        description:
          'Authentication is required. Provide a valid Supabase access token as a Bearer token in the Authorization header to use AcademicFlow tools.',
      },
      async () => ({
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Authentication required',
            message: 'Please provide a valid AcademicFlow access token as a Bearer token in the Authorization header.',
            hint: 'The token should be a Supabase JWT obtained by signing into AcademicFlow.',
          }),
        }],
        isError: true,
      }),
    );
  }

  return server;
});

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Disable x-powered-by for security
app.disable('x-powered-by');

// CORS headers for MCP clients
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// ── Health endpoint ─────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'academicflow-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── MCP endpoint (Streamable HTTP) ──────────────────────────────────────────

const nodeHandler = toNodeHandler(handler);
app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));

// ── Start server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.error(`[AcademicFlow MCP] Server running on http://localhost:${PORT}`);
  console.error(`[AcademicFlow MCP] Health:    GET  http://localhost:${PORT}/health`);
  console.error(`[AcademicFlow MCP] MCP:       POST http://localhost:${PORT}/mcp`);
  console.error(`[AcademicFlow MCP] Inspector: npx @modelcontextprotocol/inspector --url http://localhost:${PORT}/mcp`);
});
