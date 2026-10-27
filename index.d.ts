export interface LoadOptions {
  /** Base currency of the loaded table. Default "USD". */
  base?: string;
  /** AllRatesToday API key. Without one, the keyless ECB table is used. Also read from ALLRATESTODAY_API_KEY. */
  apiKey?: string;
  /** Custom fetch implementation (Node < 18, tests). */
  fetch?: typeof fetch;
  /** API host. Default "https://allratestoday.com". */
  baseUrl?: string;
}

export interface RateTable {
  base: string;
  date: string;
  rates: Record<string, number>;
  /** "ecb" (keyless reference table) or "mid-market" (keyed, real-time). */
  source: string;
}

export interface ConvertOptions {
  from?: string;
  to?: string;
}

export interface FxWrapper {
  from(currency: string): FxWrapper;
  to(currency: string): number;
  convert(opts?: ConvertOptions): number;
}

export interface Fx {
  (value: number): FxWrapper;
  version: string;
  rates: Record<string, number>;
  base: string;
  date: string;
  source: string;
  settings: { from: string; to: string };
  attribution: string;
  attributionHtml: string;
  convert(value: number, opts?: ConvertOptions): number;
  convert(value: number[], opts?: ConvertOptions): number[];
  fetchRates(opts?: LoadOptions): Promise<RateTable>;
  load(opts?: LoadOptions): Promise<Fx>;
  loadInto<T extends { base: string; rates: Record<string, number> }>(money: T, opts?: LoadOptions): Promise<T>;
}

declare const fx: Fx;
export default fx;
export { fx };
