# money-rates

[![npm version](https://img.shields.io/npm/v/money-rates)](https://www.npmjs.com/package/money-rates)
[![license](https://img.shields.io/npm/l/money-rates)](./LICENSE)

**money.js with the rates built in.** Same API as [money.js](https://www.npmjs.com/package/money) (`fx(100).from('USD').to('GBP')`, `fx.convert`, `fx.rates`, `fx.base`, `fx.settings`), plus `fx.load()`, which fetches a rate table for you.

- **No key needed:** the European Central Bank reference table (about 30 currencies, any base, updated each business day).
- **With a free key:** real-time mid-market rates for 160+ currencies from [AllRatesToday](https://allratestoday.com).
- Zero dependencies, about 150 lines, CommonJS + ESM + TypeScript types.

money.js was last released in 2014 and never shipped rates. You load them yourself, usually from a paid feed. This package does that step for you.

## Install

```bash
npm install money-rates
```

## Use

```js
const fx = require('money-rates');   // or: import fx from 'money-rates'

await fx.load();                      // keyless ECB table, base USD

fx(100).from('USD').to('GBP');        // 74.92
fx.convert(1, { from: 'EUR', to: 'JPY' });
fx.convert([10, 20], { from: 'USD', to: 'EUR' });

fx.settings = { from: 'USD', to: 'EUR' };
fx.convert(50);

console.log(fx.base, fx.date, fx.source);   // "USD" "2026-10-26" "ecb"
```

Real-time mid-market rates for 160+ currencies with a key ([get a free one](https://allratestoday.com/register/)):

```js
await fx.load({ apiKey: process.env.ALLRATESTODAY_API_KEY });  // or just set the env var
fx(100).from('USD').to('NGN');
```

## Already using money.js?

Keep it. Fill its rates with one call:

```js
const money = require('money');
const { loadInto } = require('money-rates');

await loadInto(money);                // keyless ECB rates
money(100).from('USD').to('EUR');
```

Or swap the import: `require('money')` to `require('money-rates')`, then add `await fx.load()` where you used to set `fx.rates` by hand. Step-by-step guide: [allratestoday.com/migrate/money-js/](https://allratestoday.com/migrate/money-js/).

## API

| | |
|---|---|
| `fx(value).from(a).to(b)` | Convert, money.js style |
| `fx.convert(value, { from, to })` | Convert a number or an array of numbers |
| `fx.rates`, `fx.base`, `fx.settings` | Same as money.js; set them by hand if you like |
| `fx.load({ base, apiKey, fetch })` | Fetch a table into `fx`. Resolves to `fx` |
| `fx.loadInto(money, opts)` | Fetch a table into an existing money.js object |
| `fx.fetchRates(opts)` | Return `{ base, date, rates, source }` without changing state |
| `fx.date`, `fx.source` | Table date and `"ecb"` or `"mid-market"` |
| `fx.attribution`, `fx.attributionHtml` | Link text for keyless use |

Cross rates (`EUR` to `JPY` on a `USD` table) are computed exactly as money.js does. A missing currency throws `fx error`.

## Attribution (keyless use)

Without a key, the rates are free for any use, commercial included. Where you show them, add a visible link:

```html
<a href="https://allratestoday.com">Exchange rates by AllRatesToday</a>
```

`fx.attributionHtml` holds that snippet. See the [terms](https://allratestoday.com/terms/#attribution).

## Links

- [Migrating from money.js](https://allratestoday.com/migrate/money-js/)
- [Keyless open API](https://allratestoday.com/open-api/)
- [Exchange rate API](https://allratestoday.com/exchange-rate-api/)
- [JavaScript SDK `@allratestoday/sdk`](https://www.npmjs.com/package/@allratestoday/sdk)
- [ChatGPT app](https://chatgpt.com/plugins/plugin_asdk_app_6ae1e76098f48191a285ac3f5ab7a83b) — ask ChatGPT for live and official central bank rates

money.js is © Open Exchange Rates, MIT. This package is an independent reimplementation of its API and is not affiliated with it.

## License

MIT
