import {
  classifyQuadrant,
  computeCompositeScore,
  computeFinancialScore,
  computeImpactScore,
  defaultWeights,
  demoStakeholders,
  generateSectorCatalogue,
  sectors,
} from '../../../packages/shared/src/index.js';

export class InMemoryDmaService {
  constructor() {
    const catalogue = generateSectorCatalogue();
    this.state = {
      organizations: [{ id: 'demo-org', name: 'Demo Tenant', settings: { weights: defaultWeights, thresholds: { impact: 3, financial: 3 } } }],
      sectors: sectors.map((name, index) => ({ id: `sector-${index + 1}`, name })),
      iros: catalogue.map((row, index) => ({ id: `iro-${index + 1}`, orgId: 'demo-org', sectorId: `sector-${sectors.indexOf(row.sector) + 1}`, ...row })),
      stakeholders: demoStakeholders.map((row, index) => ({ id: `stk-${index + 1}`, orgId: 'demo-org', ...row })),
      shortlist: [],
      impactScores: [],
      financialScores: [],
      compositeResults: [],
      auditLogs: [],
    };

    ['iro-1', 'iro-2', 'iro-35', 'iro-90', 'iro-155'].forEach((iroId, idx) => {
      const selected = this.selectShortlist('demo-org', 'seed', { iroId, selected: true, notes: 'Demo shortlisted item' });
      const impact = this.saveImpactScore('demo-org', 'seed', {
        shortlistId: selected.id,
        scale: 4 + (idx % 2),
        scope: 3 + (idx % 2),
        irremediability: 4,
        likelihood: 3 + (idx % 3),
        stakeholderInput: 4,
        iroType: this.state.iros.find((iro) => iro.id === iroId).iroType,
      });
      const financial = this.saveFinancialScore('demo-org', 'seed', {
        shortlistId: selected.id,
        magnitude: 3 + (idx % 2),
        likelihood: 4,
      });
      this.saveCompositeScore('demo-org', 'seed', { shortlistId: selected.id, impactScore: impact.impactScore, financialScore: financial.financialScore });
    });
  }

  audit(orgId, actorId, entityType, entityId, action, before, after) {
    const record = { id: `audit-${this.state.auditLogs.length + 1}`, orgId, actorId, entityType, entityId, action, before, after, at: new Date().toISOString() };
    this.state.auditLogs.push(record);
    return record;
  }

  selectShortlist(orgId, actorId, payload) {
    const row = { id: `short-${this.state.shortlist.length + 1}`, orgId, ...payload };
    this.state.shortlist.push(row);
    this.audit(orgId, actorId, 'Shortlist', row.id, 'UPSERT', null, row);
    return row;
  }

  saveImpactScore(orgId, actorId, payload) {
    const shortlist = this.state.shortlist.find((row) => row.id === payload.shortlistId);
    const result = { ...payload, impactScore: computeImpactScore(payload), id: `impact-${this.state.impactScores.length + 1}` };
    this.state.impactScores = this.state.impactScores.filter((row) => row.shortlistId !== payload.shortlistId).concat(result);
    this.audit(orgId, actorId, 'ImpactScoring', result.id, 'UPSERT', null, result);
    return { ...result, iroId: shortlist?.iroId };
  }

  saveFinancialScore(orgId, actorId, payload) {
    const result = { ...payload, financialScore: computeFinancialScore(payload.magnitude, payload.likelihood), id: `financial-${this.state.financialScores.length + 1}` };
    this.state.financialScores = this.state.financialScores.filter((row) => row.shortlistId !== payload.shortlistId).concat(result);
    this.audit(orgId, actorId, 'FinancialScoring', result.id, 'UPSERT', null, result);
    return result;
  }

  saveCompositeScore(orgId, actorId, payload) {
    const shortlist = this.state.shortlist.find((row) => row.id === payload.shortlistId);
    const iro = this.state.iros.find((row) => row.id === shortlist?.iroId);
    const compositeScore = computeCompositeScore(payload.impactScore, payload.financialScore);
    const quadrant = classifyQuadrant(payload.impactScore, payload.financialScore, this.state.organizations[0].settings.thresholds);
    const result = {
      id: `composite-${this.state.compositeResults.length + 1}`,
      shortlistId: payload.shortlistId,
      compositeScore,
      pillar: iro?.pillar ?? 'E',
      materialityConclusion: quadrant === 'High Priority' ? 'Material' : 'Monitor or reassess',
      explanations: {
        impact: `Impact score ${payload.impactScore} based on weighted severity and stakeholder views.`,
        financial: `Financial score ${payload.financialScore} based on square-root magnitude-likelihood formula.`,
      },
      quadrant,
      iroTopic: iro?.topic ?? 'Unknown',
      impactScore: payload.impactScore,
      financialScore: payload.financialScore,
    };
    this.state.compositeResults = this.state.compositeResults.filter((row) => row.shortlistId !== payload.shortlistId).concat(result);
    this.audit(orgId, actorId, 'CompositeResult', result.id, 'UPSERT', null, result);
    return result;
  }

  getMatrix(orgId) {
    return this.state.compositeResults
      .filter((row) => this.state.shortlist.find((s) => s.id === row.shortlistId)?.orgId === orgId)
      .sort((a, b) => b.compositeScore - a.compositeScore || Math.max(b.impactScore, b.financialScore) - Math.max(a.impactScore, a.financialScore))
      .map((row, index) => ({ ...row, priorityRank: index + 1 }));
  }

  getOpenApi() {
    return {
      openapi: '3.1.0',
      info: { title: 'DMA Playbook API', version: '0.1.0' },
      paths: {
        '/auth/login': { post: { summary: 'Login' } },
        '/org/settings': { get: { summary: 'Get organization settings' }, put: { summary: 'Update settings' } },
        '/sectors': { get: { summary: 'List sectors' } },
        '/iro': { get: { summary: 'List IROs' }, post: { summary: 'Create IRO' } },
        '/stakeholders': { get: { summary: 'List stakeholders' } },
        '/shortlist': { post: { summary: 'Select shortlist' } },
        '/scoring/impact': { post: { summary: 'Compute and persist impact score' } },
        '/scoring/financial': { post: { summary: 'Compute and persist financial score' } },
        '/scoring/composite': { post: { summary: 'Compute and persist composite score' } },
        '/matrix/chart-data': { get: { summary: 'Get matrix chart data' } },
        '/export/excel': { post: { summary: 'Queue Excel export' } },
        '/export/pdf': { post: { summary: 'Queue PDF export' } },
        '/audit/:entityType/:entityId': { get: { summary: 'Entity audit trail' } }
      }
    };
  }
}
