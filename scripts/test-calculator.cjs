const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = module.paths;
  const originalRequire = mod.require.bind(mod);
  mod.require = name => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name);
  mod._compile(compiled, filename);
  return mod.exports;
}
const { calculateEstimate, initialConfig, featureQuantity, isFeatureVisible, configErrors, validateCalculator, prepareCalculator, pageCount, pageSelectionErrors, pageSummary, SOLUTION_GUIDANCE, configWithPages, packagePageIds, effectiveFeatureSelections, pricedFeatureQuantity } = load('lib/calculator.ts');
const { DEFAULT_CALCULATOR } = load('types/calculator.ts');
const fixture = structuredClone(DEFAULT_CALCULATOR);
const config = initialConfig(fixture);
const feature = fixture.steps[1].fields.find(field => field.id === 'copywriting');

test('template page count changes the estimate and required work cannot be removed', () => {
  assert.equal(calculateEstimate(fixture, config, {}).totalHours, 170);
  assert.equal(calculateEstimate(fixture, { ...config, num_pages: 3 }, { site_planning: false }).totalHours, 210);
});
test('optional quantity default is used without editing the input', () => {
  assert.equal(featureQuantity(feature, config, {}), 10);
  const estimate = calculateEstimate(fixture, config, { copywriting: true });
  assert.equal(estimate.totalHours, 420);
  assert.equal(estimate.lineItems.find(item => item.label.startsWith('Copywriting')).cost, 37500);
});
test('visitor hourly-rate overrides cannot change pricing', () => {
  assert.deepEqual(calculateEstimate(fixture, { ...config, hourly_rate: -100 }, {}), calculateEstimate(fixture, config, {}));
});
test('quantity limits reject negative effects and handle zero, empty and non-finite values', () => {
  const bounded = { ...feature, minQuantity: 0, maxQuantity: 20 };
  for (const [raw, expected] of [[-5, 0], [0, 0], [50, 20], ['', 10], [Infinity, 10], [2.8, 2]]) {
    assert.equal(featureQuantity(bounded, {}, { copywriting_qty: raw }), expected);
  }
});
test('false, zero and numeric select conditions match consistently', () => {
  for (const value of [false, 0, 2]) assert.equal(isFeatureVisible({ ...feature, conditional: { showWhen: 'control', value } }, { control: String(value) }, {}), true);
  assert.equal(isFeatureVisible({ ...feature, conditional: { showWhen: 'control', value: false } }, { control: false }, { control: true }), true);
});
test('hidden selected and required features do not affect totals', () => {
  const definition = { defaultHourlyRate: 100, steps: [{ fields: [{ ...feature, mandatory: true, conditional: { showWhen: 'type', value: 'shop' } }] }] };
  assert.equal(calculateEstimate(definition, { type: 'other' }, { copywriting: true }).totalPrice, 0);
});
test('selected options add their configured hours', () => {
  assert.equal(calculateEstimate(fixture, { ...config, website_type: 'ecommerce' }, {}).totalHours, 210);
});
test('required answers, numeric bounds and options are validated; zero is not empty', () => {
  assert.equal(configErrors([{ id: 'n', type: 'number', label: 'Count', required: true, min: 0, max: 5 }], { n: 0 }).length, 0);
  assert.equal(configErrors(fixture.steps[0].fields, { ...config, num_pages: -1 }).length, 1);
  assert.equal(configErrors(fixture.steps[0].fields, { ...config, website_type: 'invalid' }).length, 1);
  assert.equal(configErrors(fixture.steps[0].fields, { ...config, num_pages: '' }).length, 1);
});
test('definition validation catches duplicate IDs, bad rates and missing quantity references', () => {
  assert.doesNotThrow(() => validateCalculator(fixture));
  assert.throws(() => validateCalculator({ ...fixture, defaultHourlyRate: 0 }));
  assert.throws(() => validateCalculator({ ...fixture, steps: [fixture.steps[0], fixture.steps[0]] }));
  const invalid = structuredClone(fixture); invalid.steps[1].fields[1].quantityFrom = 'missing';
  assert.throws(() => validateCalculator(invalid));
});
test('displayed line items sum exactly to the stored estimate', () => {
  const estimate = calculateEstimate({ defaultHourlyRate: 19.99, steps: [{ fields: [{ id: 'a', label: 'A', hours: 0.333, mandatory: true }, { id: 'b', label: 'B', hours: 0.667, mandatory: true }] }] }, {}, {});
  assert.equal(estimate.totalPrice, Math.round(estimate.lineItems.reduce((sum, item) => sum + item.cost, 0) * 100) / 100);
});

function apiFixture({ enabled = true, active = true, count = 0, failWrite = false, definition = fixture } = {}) {
  const writes = [];
  const db = {
    doc: () => ({ get: async () => ({ data: () => ({ features: { calculators: { enabled } } }) }) }),
    collection: collection => ({ doc: id => ({ collection, id: id ?? 'new-lead', get: async () => ({ exists: true, id: 'calculator', data: () => ({ ...definition, isActive: active }) }) }) }),
    runTransaction: async callback => {
      const pending = [];
      const result = await callback({ get: async () => ({ data: () => ({ count, windowStart: { toMillis: () => Date.now() } }) }), set: (ref, data) => pending.push({ ref, data }) });
      if (failWrite) throw new Error('Simulated write failure');
      writes.push(...pending); return result;
    },
  };
  const { POST } = load('app/api/calculators/submit/route.ts', {
    '@/lib/firebase/admin': { getAdminFirestore: () => db },
    '@/lib/calculator': load('lib/calculator.ts'),
    '@/lib/utils/rate-limit': { getClientIdentifier: () => '127.0.0.1' },
  });
  const payload = { calculatorId: 'calculator', config, pageSelections: { num_pages: { pages: ['home', 'contact'], otherPages: [], unsure: false } }, selections: { copywriting: true }, contactInfo: { name: 'Test', email: 'test@example.com' }, consent: true, website: '' };
  return { writes, post: overrides => POST(new Request('http://localhost/api/calculators/submit', { method: 'POST', body: JSON.stringify({ ...payload, ...overrides }) })) };
}
test('API ignores forged totals and rates, saves labelled answers and commits both lead records', async () => {
  const { post, writes } = apiFixture();
  const response = await post({ totalPrice: 1, hourlyRate: 1, config: { ...config, hourly_rate: 1 } });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.estimate.totalPrice, 63000);
  const submission = writes.find(write => write.ref.collection === 'calculatorSubmissions').data;
  const message = writes.find(write => write.ref.collection === 'contactMessages').data;
  assert.equal(submission.config.num_pages, 2);
  assert.equal(submission.hourlyRate, 150);
  assert.equal(submission.consent, true);
  assert.match(message.message, /Website Type: Informational/);
  assert.match(message.message, /Copywriting/);
});
test('API rejects disabled calculators, missing consent, invalid answers and honeypot submissions', async () => {
  assert.equal((await apiFixture({ enabled: false }).post()).status, 404);
  assert.equal((await apiFixture({ active: false }).post()).status, 404);
  assert.equal((await apiFixture().post({ consent: false })).status, 400);
  assert.equal((await apiFixture().post({ pageSelections: {} })).status, 400);
  assert.equal((await apiFixture().post({ website: 'spam' })).status, 400);
});
test('API rate limit returns 429 without saving a lead', async () => {
  const { post, writes } = apiFixture({ count: 5 });
  assert.equal((await post()).status, 429);
  assert.equal(writes.length, 0);
});

const pagesField = fixture.steps[0].fields.find(field => field.id === 'num_pages');
test('page checklist counts sections and named additional pages', () => {
  const selection = { pages: ['home', 'blog', 'shop'], otherPages: ['Portfolio', 'Bookings'], unsure: false };
  assert.equal(pageCount(pagesField, selection), 5);
  assert.equal(pageSelectionErrors(pagesField, selection).length, 0);
  assert.match(pageSummary(pagesField, selection), /5 pages: Home, Products \/ Shop, Blog \/ News, Portfolio, Bookings/);
});
test('page checklist rejects empty choices, unnamed pages, duplicates, unknown choices and counts over the limit', () => {
  for (const selection of [
    { pages: [], otherPages: [], unsure: false },
    { pages: ['home'], otherPages: [' '], unsure: false },
    { pages: ['home', 'home'], otherPages: [], unsure: false },
    { pages: ['home'], otherPages: ['HOME'], unsure: false },
    { pages: ['unknown'], otherPages: [], unsure: false },
    { pages: ['home'], otherPages: [], unsure: true },
  ]) assert.ok(pageSelectionErrors(pagesField, selection).length > 0);
  assert.ok(pageSelectionErrors({ ...pagesField, max: 1 }, { pages: ['home', 'about'], otherPages: [], unsure: false }).length > 0);
});
test('not sure uses the configured provisional count and retains that context', () => {
  const selection = { pages: [], otherPages: [], unsure: true };
  assert.equal(pageCount(pagesField, selection), 2);
  assert.equal(pageSelectionErrors(pagesField, selection).length, 0);
  assert.match(pageSummary(pagesField, selection), /provisional estimate assumes 2 pages/);
  assert.equal(pageCount({ ...pagesField, defaultValue: 20, max: 5 }, selection), 5);
});
test('legacy page fields upgrade without mutating definitions or changing per-unit pricing', () => {
  const legacy = structuredClone(fixture);
  legacy.steps[0].fields[1].type = 'number';
  delete legacy.steps[1].fields[1].quantityFrom;
  legacy.steps[1].fields[1].hasQuantity = true;
  const prepared = prepareCalculator(legacy);
  assert.equal(legacy.steps[0].fields[1].type, 'number');
  assert.equal(prepared.steps[0].fields[1].type, 'pages');
  assert.equal(prepared.steps[1].fields[1].quantityFrom, 'num_pages');
  assert.equal(prepared.defaultHourlyRate, legacy.defaultHourlyRate);
  assert.equal(prepared.steps[1].fields[1].hours, legacy.steps[1].fields[1].hours);
  assert.deepEqual(prepareCalculator(prepared), prepared);
});
test('API derives page count from choices and stores names rather than trusting the supplied number', async () => {
  const { post, writes } = apiFixture();
  const response = await post({ config: { ...config, num_pages: 1 }, pageSelections: { num_pages: { pages: ['home', 'contact'], otherPages: ['Portfolio'], unsure: false } } });
  assert.equal(response.status, 201);
  const submission = writes.find(write => write.ref.collection === 'calculatorSubmissions').data;
  assert.equal(submission.config.num_pages, 3);
  assert.equal(submission.totalPrice, 69000);
  assert.match(submission.pageSummaries.num_pages, /Portfolio/);
  assert.match(writes.find(write => write.ref.collection === 'contactMessages').data.message, /3 pages: Home \(included\), Contact \(included\), Portfolio/);
});
test('API retains uncertainty and rejects malformed page choices before creating leads', async () => {
  const { post, writes } = apiFixture();
  assert.equal((await post({ pageSelections: { num_pages: { pages: [], otherPages: [], unsure: true } } })).status, 201);
  assert.match(writes.find(write => write.ref.collection === 'calculatorSubmissions').data.pageSummaries.num_pages, /Not sure yet/);
  const bad = apiFixture();
  assert.equal((await bad.post({ pageSelections: { num_pages: { pages: ['home'], otherPages: [''], unsure: false } } })).status, 400);
  assert.equal(bad.writes.length, 0);
});
test('all five solution types have two examples and suggestions; custom copy and prices are preserved', () => {
  for (const guidance of Object.values(SOLUTION_GUIDANCE)) {
    assert.equal(guidance.examples.length, 2);
    assert.ok(guidance.description && guidance.suggestedPages.length > 0);
  }
  const definition = structuredClone(fixture);
  definition.steps[0].fields[0].options = [{ label: 'Professional Website', value: 'pro', hours: 17, description: 'Custom description', examples: ['Custom example'] }];
  const option = prepareCalculator(definition).steps[0].fields[0].options[0];
  assert.equal(option.hours, 17);
  assert.equal(option.description, 'Custom description');
  assert.deepEqual(option.examples, ['Custom example']);
  assert.ok(option.suggestedPages.includes('Portfolio or case studies'));
});

const packaged = prepareCalculator(fixture);
const shopConfig = { ...config, website_type: 'ecommerce' };
const emptyPages = { pages: [], otherPages: [], unsure: false };

test('starter packages preserve rates and setup hours, include shop, and split base from extras', () => {
  const answers = configWithPages(packaged, shopConfig, { num_pages: emptyPages });
  assert.equal(answers.num_pages, 3);
  const base = calculateEstimate(packaged, answers, { landing_page_design: false });
  assert.equal(base.totalHours, 250); // 40 setup + 120 pages + 90 globally required
  assert.equal(base.basePrice, 37500);
  assert.equal(base.additionsPrice, 0);
  assert.ok(base.packageServices.includes('Checkout'));
  const extraAnswers = configWithPages(packaged, shopConfig, { num_pages: { ...emptyPages, pages: ['shop', 'about'] } });
  const extra = calculateEstimate(packaged, extraAnswers, { copywriting: true, copywriting_qty: 1 });
  assert.equal(extraAnswers.num_pages, 4);
  assert.equal(extra.basePrice, base.basePrice);
  assert.equal(extra.additionsPrice, (40 + 25) * 150);
  assert.equal(extra.basePrice + extra.additionsPrice, extra.totalPrice);
});

test('switching packages removes automatic pages but preserves manual choices and avoids duplicates', () => {
  const manual = { num_pages: { ...emptyPages, pages: ['about'] } };
  assert.equal(configWithPages(packaged, shopConfig, manual).num_pages, 4);
  assert.equal(configWithPages(packaged, config, manual).num_pages, 3);
  assert.deepEqual(manual.num_pages.pages, ['about']);
  const manualShop = { num_pages: { ...emptyPages, pages: ['shop'] } };
  assert.equal(configWithPages(packaged, shopConfig, manualShop).num_pages, 3);
  assert.equal(configWithPages(packaged, config, manualShop).num_pages, 3);
  const included = packagePageIds(packaged, shopConfig, 'num_pages');
  assert.equal(pageSelectionErrors(pagesField, emptyPages, included).length, 0);
  assert.equal(pageCount(pagesField, { ...emptyPages, unsure: true }, included), 3);
  assert.ok(pageSelectionErrors({ ...pagesField, max: 2 }, emptyPages, included).length);
});

test('custom packages override starters; required quantities and dependent conditions are consistent', () => {
  const definition = structuredClone(packaged);
  const option = definition.steps[0].fields[0].options[0];
  option.package = { pageFieldId: 'num_pages', includedPages: ['home'], includedFeatureIds: ['copywriting'], recommendedFeatureIds: [], includedServices: ['Custom setup'] };
  definition.steps[1].fields.push({ id: 'dependent', label: 'Dependent', hours: 2, mandatory: true, conditional: { showWhen: 'copywriting', value: true } });
  const answers = configWithPages(definition, config, { num_pages: emptyPages });
  const estimate = calculateEstimate(definition, answers, { copywriting: false, copywriting_qty: 0 });
  assert.equal(pricedFeatureQuantity(feature, answers, { copywriting_qty: 0 }, true), 10);
  assert.ok(estimate.lineItems.some(item => item.label.startsWith('Dependent')));
  assert.equal(estimate.additionsPrice, 0);
  assert.deepEqual(prepareCalculator(definition).steps[0].fields[0].options[0].package, option.package);
  assert.equal(effectiveFeatureSelections(definition, answers, { copywriting: false }).copywriting, true);
  option.package.includedFeatureIds = ['missing'];
  assert.throws(() => validateCalculator(definition), /no longer exists/);
});

test('splitting fractional page work preserves its rounded total hours and price', () => {
  const definition = { defaultHourlyRate: 19.99, steps: [{ fields: [
    { id: 'solution', label: 'Solution', type: 'select', defaultValue: 'a', options: [{ value: 'a', label: 'A', hours: 0, package: { pageFieldId: 'pages', includedPages: ['home'], includedFeatureIds: ['design'], recommendedFeatureIds: [], includedServices: [] } }] },
    { id: 'pages', label: 'Pages', type: 'pages', defaultValue: 1 },
    { id: 'design', label: 'Design', hours: 0.333, quantityFrom: 'pages' },
  ] }] };
  const estimate = calculateEstimate(definition, { solution: 'a', pages: 3 }, {});
  assert.equal(estimate.totalHours, 1);
  assert.equal(estimate.totalPrice, 19.99);
  assert.equal(Math.round((estimate.basePrice + estimate.additionsPrice) * 100) / 100, 19.99);
});

test('API enforces package pages, setup scope and features regardless of client prices or field order', async () => {
  const definition = structuredClone(fixture);
  definition.steps[0].fields.reverse();
  const { post, writes } = apiFixture({ definition });
  const response = await post({ config: { ...shopConfig, num_pages: 0 }, pageSelections: { num_pages: emptyPages }, selections: { site_planning: false, landing_page_design: false }, basePrice: 1, packageServices: ['forged'] });
  assert.equal(response.status, 201);
  const { estimate } = await response.json();
  assert.equal(estimate.totalPrice, 37500);
  const saved = writes.find(write => write.ref.collection === 'calculatorSubmissions').data;
  assert.equal(saved.config.num_pages, 3);
  assert.deepEqual(saved.pageSelections.num_pages.pages, ['home', 'shop', 'contact']);
  assert.equal(saved.selections.landing_page_design, true);
  assert.ok(saved.packageServices.includes('Checkout'));
  assert.ok(!saved.packageServices.includes('forged'));
  assert.match(writes.find(write => write.ref.collection === 'contactMessages').data.message, /Included package services: Product catalogue setup, Shopping cart, Checkout, Payment integration/);
});
