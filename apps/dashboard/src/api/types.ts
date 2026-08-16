/** Envelope di risposta condiviso da tutti gli endpoint. */
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  /** Origine del dato: utile in dev/demo per capire se è un fallback. */
  source?: "network" | "demo" | "fallback";
  /** Metadati non di dominio (diagnostica, warning non bloccanti). */
  meta?: ApiMeta;
};

export type ApiMeta = {
  /** Righe del log sorgente scartate perché malformate. */
  discardedRows?: number;
  /** Id di correlazione restituito dal server (o generato dal client). */
  requestId?: string;
  [key: string]: unknown;
};

export type ApiError = {
  status: number;
  code: string;
  message: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  /** Numero totale di pagine, sempre >= 1: la UI non lo ricalcola. */
  pageCount: number;
};

/** Parametri di lista accettati da tutti gli endpoint collection. */
export type ListQuery = {
  page?: number;
  pageSize?: number;
  order?: "asc" | "desc";
} & Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Numero massimo di tentativi aggiuntivi su errori transitori (default 2). */
  retries?: number;
};

/** Risultato completo di una chiamata: dati + provenienza + metadati. */
export type ApiResult<T> = {
  data: T;
  source: NonNullable<ApiResponse<T>["source"]>;
  meta: ApiMeta;
};
