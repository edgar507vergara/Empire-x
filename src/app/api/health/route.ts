import { isConfigured } from '@/server/auth';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json({ configured: isConfigured(), version: '0.1.0', simulation: 'server-authoritative' }, { headers: { 'Cache-Control': 'no-store' } }); }
