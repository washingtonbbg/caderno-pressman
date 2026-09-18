type D1Value = null | number | string | ArrayBuffer | ArrayBufferView;
type D1Meta = {changes:number;duration?:number;last_row_id?:number;rows_read?:number;rows_written?:number};
interface D1Result<T = Record<string, unknown>> {results:T[];success:boolean;meta:D1Meta;error?:string}
interface D1PreparedStatement {
  bind(...values:D1Value[]):D1PreparedStatement;
  first<T = Record<string, unknown>>(column?:string):Promise<T|null>;
  all<T = Record<string, unknown>>():Promise<D1Result<T>>;
  run<T = Record<string, unknown>>():Promise<D1Result<T>>;
  raw<T = unknown[]>(options?:{columnNames?:boolean}):Promise<T[]>;
}
interface D1Database {
  prepare(query:string):D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements:D1PreparedStatement[]):Promise<D1Result<T>[]>;
  exec(query:string):Promise<D1ExecResult>;
  dump():Promise<ArrayBuffer>;
}
interface D1ExecResult {count:number;duration:number}
interface Fetcher {fetch(input:RequestInfo|URL,init?:RequestInit):Promise<Response>}
interface R2ObjectBody {body:ReadableStream<Uint8Array>;httpMetadata?:{contentType?:string};writeHttpMetadata(headers:Headers):void}
interface R2Bucket {
  get(key:string):Promise<R2ObjectBody|null>;
  put(key:string,value:ArrayBuffer|ArrayBufferView|Blob|string|ReadableStream,options?:{httpMetadata?:{contentType?:string}}):Promise<unknown>;
  delete(key:string|string[]):Promise<void>;
}
declare namespace Cloudflare {
  interface Env {ASSETS:Fetcher;DB:D1Database;LIBRARY:R2Bucket;LIBRARY_ADMIN_EMAILS?:string;IMAGES:ImagesBinding}
}
declare module 'cloudflare:workers' {export const env:Cloudflare.Env}
