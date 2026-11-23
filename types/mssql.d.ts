declare module "mssql" {
  namespace sql {
    class ConnectionPool {
      constructor(config: unknown);
      connect(): Promise<ConnectionPool>;
      request(): Request;
    }

    class Request {
      input(name: string, type: unknown, value?: unknown): Request;
      query<T = Record<string, unknown>>(command: string): Promise<{ recordset: T[] }>;
    }

    const MAX: number;
    const Int: unknown;
    const Bit: unknown;
    const UniqueIdentifier: unknown;
    function NVarChar(length?: number): unknown;
    function Decimal(precision: number, scale: number): unknown;
  }

  export = sql;
}
