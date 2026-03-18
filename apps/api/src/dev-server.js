import http from 'node:http';
import { InMemoryDmaService } from './domain.js';

const service = new InMemoryDmaService();

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json', 'x-request-id': crypto.randomUUID() });
  res.end(JSON.stringify(body, null, 2));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  const orgId = 'demo-org';
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'GET' && url.pathname === '/ready') return send(res, 200, { status: 'ready' });
  if (req.method === 'GET' && url.pathname === '/api/docs') return send(res, 200, service.getOpenApi());
  if (req.method === 'GET' && url.pathname === '/sectors') return send(res, 200, service.state.sectors);
  if (req.method === 'GET' && url.pathname === '/iro') return send(res, 200, service.state.iros);
  if (req.method === 'GET' && url.pathname === '/stakeholders') return send(res, 200, service.state.stakeholders);
  if (req.method === 'GET' && url.pathname === '/matrix/chart-data') return send(res, 200, service.getMatrix(orgId));
  if (req.method === 'GET' && url.pathname.startsWith('/audit/')) {
    const [, , entityType, entityId] = url.pathname.split('/');
    return send(res, 200, service.state.auditLogs.filter((log) => log.entityType === entityType && log.entityId === entityId));
  }
  if (req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === '/shortlist') return send(res, 200, service.selectShortlist(orgId, 'demo-user', body));
    if (url.pathname === '/scoring/impact') return send(res, 200, service.saveImpactScore(orgId, 'demo-user', body));
    if (url.pathname === '/scoring/financial') return send(res, 200, service.saveFinancialScore(orgId, 'demo-user', body));
    if (url.pathname === '/scoring/composite') return send(res, 200, service.saveCompositeScore(orgId, 'demo-user', body));
    if (url.pathname === '/export/excel') return send(res, 202, { jobId: 'job-excel-1', status: 'queued', workbookSheets: ['1.Scoping & Value chain Mapping', '2. Primary long list', '3.IRO Sector classification ->', '3.1-3.11 Sector tabs', '4. Stakeholder Engagement', '5. Shortlist & Scoring', '6. Materiality Matrix'] });
    if (url.pathname === '/export/pdf') return send(res, 202, { jobId: 'job-pdf-1', status: 'queued', layout: 'A4 landscape' });
  }
  send(res, 404, { error: 'Not found' });
});

server.listen(3000, () => console.log('API listening on http://localhost:3000'));
