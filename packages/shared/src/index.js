const z = {
  string: () => ({ type: 'string' }),
  boolean: () => ({ type: 'boolean' }),
  number: () => ({ int() { return this; }, min() { return this; }, max() { return this; }, optional() { return this; } }),
  object: (shape) => ({ type: 'object', shape }),
};

export const sectors = [
  'Consumer Goods',
  'Extractives & Minerals',
  'Financials',
  'Food & Beverage',
  'Healthcare',
  'Infrastructure',
  'Renewable Resources',
  'Resource Transformation',
  'Services',
  'Technology and Communications',
  'Transportation',
];

export const defaultWeights = {
  scale: 0.25,
  scope: 0.25,
  irremediability: 0.2,
  likelihood: 0.2,
  stakeholderInput: 0.1,
};

export function computeImpactScore(input) {
  const weights = input.weights ?? defaultWeights;
  const irremediability = input.iroType === 'Negative impact' ? (input.irremediability ?? 1) : 0;
  const appliedIrremediabilityWeight = input.iroType === 'Negative impact' ? weights.irremediability : 0;
  const rebalanceFactor = input.iroType === 'Negative impact' ? 1 : 1 / (1 - weights.irremediability);
  const score = rebalanceFactor * (
    weights.scale * input.scale +
    weights.scope * input.scope +
    appliedIrremediabilityWeight * irremediability +
    weights.likelihood * input.likelihood +
    weights.stakeholderInput * input.stakeholderInput
  );
  return Number(score.toFixed(2));
}

export function computeFinancialScore(magnitude, likelihood) {
  return Number(Math.sqrt(magnitude * likelihood).toFixed(2));
}

export function computeCompositeScore(impactScore, financialScore) {
  return Number((((impactScore + financialScore) / 2)).toFixed(2));
}

export function classifyQuadrant(impactScore, financialScore, thresholds = { impact: 3, financial: 3 }) {
  if (impactScore >= thresholds.impact && financialScore >= thresholds.financial) return 'High Priority';
  if (impactScore >= thresholds.impact && financialScore < thresholds.financial) return 'Impact-led';
  if (financialScore >= thresholds.financial && impactScore < thresholds.impact) return 'Financial-led';
  return 'Monitor';
}

export const stakeholderSchema = z.object({
  group: z.string(),
  category: z.string(),
  method: z.string(),
  frequency: z.string(),
  preliminaryMaterial: z.boolean(),
  influence: z.number().int().min(1).max(5),
  interest: z.number().int().min(1).max(5),
  keyTopics: z.string(),
  contact: z.string(),
  status: z.string(),
});

export const scoringSchema = z.object({
  scale: z.number().min(1).max(5),
  scope: z.number().min(1).max(5),
  irremediability: z.number().min(1).max(5).optional(),
  likelihood: z.number().min(1).max(5),
  stakeholderInput: z.number().min(1).max(5),
  magnitude: z.number().min(1).max(5).optional(),
  financialLikelihood: z.number().min(1).max(5).optional(),
});

const pillarCycle = ['E', 'S', 'G', 'E/S', 'S/G'];
const typeCycle = ['Negative impact', 'Positive Impact', 'Risk', 'Opportunity'];
const riskCycle = ['Transition', 'Physical', 'N/A'];
const topics = [
  'Climate resilience', 'Water stewardship', 'Human rights due diligence', 'Product safety', 'Cybersecurity',
  'Board governance', 'Waste circularity', 'Supply chain labor conditions', 'Data privacy', 'Community relations',
  'Biodiversity', 'Responsible sourcing', 'Energy transition', 'Access and affordability', 'Business ethics'
];

export function generateSectorCatalogue() {
  return sectors.flatMap((sector, sectorIndex) => Array.from({ length: 30 }, (_, i) => {
    const pillar = pillarCycle[(sectorIndex + i) % pillarCycle.length];
    const iroType = typeCycle[(sectorIndex + i) % typeCycle.length];
    const riskNature = riskCycle[(sectorIndex + i) % riskCycle.length];
    const topic = topics[(sectorIndex * 3 + i) % topics.length];
    return {
      sector,
      topic,
      iroSummary: `${sector} ${topic} ${iroType.toLowerCase()} scenario ${i + 1}`,
      iroCode: `IRO-${sectorIndex + 1}-${String(i + 1).padStart(2, '0')}`,
      pillar,
      iroName: `${topic} ${iroType}`,
      riskNature,
      iroType,
      description: `Realistic ${sector.toLowerCase()} example covering ${topic.toLowerCase()}, operational exposure, stakeholder expectations, and controllable management responses.`,
      source: i % 3 === 0 ? 'General IRO' : i % 3 === 1 ? 'Supplementing documents' : 'Stakeholder Interview',
    };
  }));
}

export const demoStakeholders = [
  ['Investors', 'Capital Markets'],
  ['Employees', 'Internal'],
  ['Suppliers', 'Value Chain'],
  ['Customers', 'Market'],
  ['Local Communities', 'Community'],
  ['Regulators', 'Public Sector'],
  ['NGOs', 'Civil Society'],
  ['Industry Associations', 'Industry'],
  ['Media', 'Public'],
  ['Scientific/Academic', 'Expert'],
].map(([group, category], index) => ({
  group,
  category,
  method: ['Interview', 'Survey', 'Workshop'][index % 3],
  frequency: ['Quarterly', 'Biannual', 'Annual'][index % 3],
  preliminaryMaterial: index < 6,
  influence: (index % 5) + 1,
  interest: ((index + 2) % 5) + 1,
  prioritizationScore: (((index % 5) + 1) * (((index + 2) % 5) + 1)),
  keyTopics: 'Climate, labor conditions, ethics, resilience',
  contact: `${String(group).toLowerCase().replace(/\s+/g, '.')}@example.com`,
  status: index % 2 === 0 ? 'Active' : 'Planned',
}));
