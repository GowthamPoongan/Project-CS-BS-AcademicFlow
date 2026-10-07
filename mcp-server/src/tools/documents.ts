/**
 * search_my_documents — Search documents the authenticated user has access to.
 *
 * Returns metadata only — never exposes private storage paths or credentials.
 * RLS ensures only the user's own documents are visible.
 */
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

export function registerDocumentTools(
  server: McpServer,
  auth: AuthContext,
): void {
  server.registerTool(
    'search_my_documents',
    {
      description:
        'Search documents that the authenticated user is authorized to access. Returns metadata such as title, type, file name, verification status, and creation date. Does not expose private storage credentials or paths.',
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .max(200)
          .describe('Search query to match against document titles, categories, and file names'),
      }),
    },
    async ({ query }) => {
      const start = Date.now();
      try {
        // Fetch all user documents and filter in-app since Supabase doesn't
        // support full-text search on this table without additional setup.
        const { data, error } = await auth.supabase
          .from('documents')
          .select('title, category, file_name, status, feedback, verified_at, created_at, semester_no, mime_type, size_bytes')
          .eq('student_id', auth.userId)
          .order('created_at', { ascending: false });

        if (error) {
          logToolCall('search_my_documents', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to search documents.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('search_my_documents', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No documents have been uploaded yet.',
                query,
              }),
            }],
          };
        }

        // Case-insensitive search across title, category, and file_name
        const q = query.toLowerCase();
        const matches = data.filter((d) =>
          d.title.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.file_name?.toLowerCase().includes(q) ?? false),
        );

        if (matches.length === 0) {
          logToolCall('search_my_documents', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_MATCHES',
                message: `No documents matching "${query}" were found.`,
                totalDocuments: data.length,
                query,
              }),
            }],
          };
        }

        const documents = matches.map((d) => ({
          title: d.title,
          category: d.category,
          fileName: d.file_name,
          mimeType: d.mime_type,
          sizeBytes: d.size_bytes,
          semester: d.semester_no,
          verificationStatus: d.status,
          feedback: d.feedback,
          verifiedAt: d.verified_at,
          createdAt: d.created_at,
        }));

        logToolCall('search_my_documents', auth.userId, true, Date.now() - start);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              documents,
              matchCount: documents.length,
              totalDocuments: data.length,
              query,
            }, null, 2),
          }],
        };
      } catch (err) {
        logToolCall('search_my_documents', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );
}
