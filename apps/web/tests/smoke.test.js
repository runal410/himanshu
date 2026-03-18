import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('dashboard contains all workflow sections', () => {
  const html = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
  for (const label of ['Setup Wizard', 'Topics Universe', 'Sector Catalogue Browser', 'Stakeholder Engagement', 'Shortlisting & Scoring', 'Materiality Matrix', 'Admin']) {
    assert.ok(html.includes(label));
  }
});
