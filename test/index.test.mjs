import test from 'node:test';
import assert from 'node:assert/strict';
import fx from '../index.mjs';

const jsonFetch = (body, ok = true, status = 200) => async (url, init) => {
  jsonFetch.last = { url, init };
  return { ok, status, json: async () => body };
};

test('money.js semantics: convert, wrapper, settings, arrays', () => {
  fx.base = 'USD';
  fx.rates = { EUR: 0.9, GBP: 0.75 };
  assert.equal(fx.convert(100, { from: 'USD', to: 'GBP' }), 75);
  assert.equal(fx(90).from('EUR').to('USD'), 100);
  assert.ok(Math.abs(fx(0.9).from('EUR').to('GBP') - 0.75) < 1e-12);
  fx.settings = { from: 'USD', to: 'EUR' };
  assert.equal(fx.convert(10), 9);
  assert.equal(fx(10).convert(), 9);
  assert.deepEqual(fx.convert([1, 2], { from: 'USD', to: 'GBP' }), [0.75, 1.5]);
  assert.throws(() => fx.convert(1, { from: 'USD', to: 'XXX' }), /fx error/);
});

test('keyless load uses /api/open/latest/{BASE}', async () => {
  const f = jsonFetch({ base_code: 'EUR', date: '2026-10-26', rates: { EUR: 1, USD: 1.1 } });
  await fx.load({ base: 'eur', fetch: f, apiKey: '' });
  assert.equal(jsonFetch.last.url, 'https://allratestoday.com/api/open/latest/EUR');
  assert.equal(fx.base, 'EUR');
  assert.equal(fx.source, 'ecb');
  assert.ok(Math.abs(fx(10).from('EUR').to('USD') - 11) < 1e-12);
});

test('keyed load uses /api/v1/rates with Bearer', async () => {
  const f = jsonFetch([{ source: 'USD', target: 'JPY', rate: 150, time: '2026-10-27T10:00:00Z' }]);
  await fx.load({ apiKey: 'k', fetch: f });
  assert.equal(jsonFetch.last.url, 'https://allratestoday.com/api/v1/rates?source=USD');
  assert.equal(jsonFetch.last.init.headers.Authorization, 'Bearer k');
  assert.equal(fx.source, 'mid-market');
  assert.equal(fx(2).from('USD').to('JPY'), 300);
});

test('loadInto fills another money.js-like object', async () => {
  const money = { base: '', rates: {} };
  const f = jsonFetch({ base_code: 'USD', rates: { USD: 1, GBP: 0.8 } });
  const out = await fx.loadInto(money, { fetch: f, apiKey: '' });
  assert.equal(out, money);
  assert.equal(money.rates.GBP, 0.8);
});

test('HTTP errors surface the API message', async () => {
  const f = jsonFetch({ error: 'Unknown base' }, false, 404);
  await assert.rejects(fx.fetchRates({ base: 'XYZ', fetch: f, apiKey: '' }), /Unknown base/);
});
