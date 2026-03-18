import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDmaService } from '../src/domain.js';

test('seeded catalogue contains 330 IROs across 11 sectors', () => {
  const service = new InMemoryDmaService();
  assert.equal(service.state.sectors.length, 11);
  assert.equal(service.state.iros.length, 330);
});

test('impact, financial, composite, and quadrant rules work', () => {
  const service = new InMemoryDmaService();
  const shortlist = service.selectShortlist('demo-org', 'tester', { iroId: 'iro-3', selected: true, notes: 'test' });
  const impact = service.saveImpactScore('demo-org', 'tester', {
    shortlistId: shortlist.id,
    scale: 5,
    scope: 4,
    irremediability: 4,
    likelihood: 5,
    stakeholderInput: 3,
    iroType: 'Negative impact',
  });
  const financial = service.saveFinancialScore('demo-org', 'tester', { shortlistId: shortlist.id, magnitude: 4, likelihood: 4 });
  const composite = service.saveCompositeScore('demo-org', 'tester', { shortlistId: shortlist.id, impactScore: impact.impactScore, financialScore: financial.financialScore });
  assert.equal(impact.impactScore, 4.35);
  assert.equal(financial.financialScore, 4);
  assert.equal(composite.compositeScore, 4.17);
  assert.equal(composite.quadrant, 'High Priority');
});

test('audit log is written for mutations', () => {
  const service = new InMemoryDmaService();
  const before = service.state.auditLogs.length;
  service.selectShortlist('demo-org', 'tester', { iroId: 'iro-4', selected: true, notes: 'audited' });
  assert.equal(service.state.auditLogs.length, before + 1);
});
