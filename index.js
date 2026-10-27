/*!
 * money-rates: money.js-compatible currency conversion with rates loaded
 * from AllRatesToday. Same fx() / fx.convert() / fx.rates / fx.base API as
 * money.js (openexchangerates/money.js, MIT), plus fx.load() and fx.loadInto().
 * https://allratestoday.com/migrate/money-js/
 */
'use strict';

var HOST = 'https://allratestoday.com';
var ATTRIBUTION = 'Exchange rates by AllRatesToday — https://allratestoday.com';
var ATTRIBUTION_HTML = '<a href="https://allratestoday.com">Exchange rates by AllRatesToday</a>';

function fx(value) {
  return new Wrapper(value);
}

fx.version = '1.0.0';
fx.rates = {};
fx.base = '';
fx.date = '';
fx.source = '';
fx.settings = { from: '', to: '' };
fx.attribution = ATTRIBUTION;
fx.attributionHtml = ATTRIBUTION_HTML;

// Rate from `from` to `to` inside the loaded table, crossed through fx.base,
// exactly as money.js computes it.
function getRate(to, from) {
  var rates = fx.rates;
  rates[fx.base] = 1;
  if (!rates[to] || !rates[from]) throw new Error('fx error: no rate for ' + from + ' -> ' + to);
  if (from === fx.base) return rates[to];
  if (to === fx.base) return 1 / rates[from];
  return rates[to] * (1 / rates[from]);
}

fx.convert = function (value, opts) {
  if (Array.isArray(value)) {
    return value.map(function (v) { return fx.convert(v, opts); });
  }
  opts = opts || {};
  var from = opts.from || fx.settings.from;
  var to = opts.to || fx.settings.to;
  return value * getRate(to, from);
};

function Wrapper(value) {
  this._v = value;
  this._from = '';
}
Wrapper.prototype.from = function (currency) {
  this._from = currency;
  return this;
};
Wrapper.prototype.to = function (currency) {
  return fx.convert(this._v, { from: this._from, to: currency });
};
Wrapper.prototype.convert = function (opts) {
  return fx.convert(this._v, opts);
};

function fetchJson(url, headers, fetchImpl) {
  var f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return Promise.reject(new Error('money-rates: no fetch available; pass { fetch } to fx.load()'));
  return f(url, { headers: headers }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (body) {
      if (!res.ok) {
        var msg = (body && (body.error || body.message)) || ('HTTP ' + res.status);
        throw new Error('money-rates: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)) + ' (' + url + ')');
      }
      return body;
    });
  });
}

// Fetch a full rate table. Without a key: the keyless ECB reference table
// (/api/open/latest/{BASE}, 30 currencies, updated each business day, visible
// attribution link required). With a key: real-time mid-market rates for
// 160+ currencies (/api/v1/rates).
fx.fetchRates = function (opts) {
  opts = opts || {};
  var base = String(opts.base || 'USD').toUpperCase();
  var host = opts.baseUrl || HOST;
  var apiKey = opts.apiKey || (typeof process !== 'undefined' && process.env && process.env.ALLRATESTODAY_API_KEY) || '';
  if (!apiKey) {
    return fetchJson(host + '/api/open/latest/' + encodeURIComponent(base), { Accept: 'application/json' }, opts.fetch)
      .then(function (body) {
        return { base: body.base_code || base, date: body.date || '', rates: body.rates || {}, source: 'ecb' };
      });
  }
  return fetchJson(host + '/api/v1/rates?source=' + encodeURIComponent(base),
    { Accept: 'application/json', Authorization: 'Bearer ' + apiKey }, opts.fetch)
    .then(function (body) {
      var list = Array.isArray(body) ? body : [body];
      var rates = {};
      var date = '';
      list.forEach(function (r) {
        if (r && r.target && typeof r.rate === 'number') rates[r.target] = r.rate;
        if (r && r.time) date = r.time;
      });
      rates[base] = 1;
      return { base: base, date: date, rates: rates, source: 'mid-market' };
    });
};

// Load rates into this fx object. Resolves to fx so calls can chain.
fx.load = function (opts) {
  return fx.fetchRates(opts).then(function (t) {
    fx.base = t.base;
    fx.rates = t.rates;
    fx.date = t.date;
    fx.source = t.source;
    return fx;
  });
};

// Load rates into an existing money.js instance: fx.loadInto(require('money')).
fx.loadInto = function (money, opts) {
  return fx.fetchRates(opts).then(function (t) {
    money.base = t.base;
    money.rates = t.rates;
    return money;
  });
};

module.exports = fx;
module.exports.default = fx;
module.exports.fx = fx;
