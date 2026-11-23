import sql from "mssql";

const globalSql = globalThis as typeof globalThis & { autoMasterSqlPool?: Promise<sql.ConnectionPool | null> };

export function getSqlPool() {
  if (!process.env.AZURE_SQL_SERVER || !process.env.AZURE_SQL_DATABASE) return Promise.resolve(null);
  if (!globalSql.autoMasterSqlPool) {
    globalSql.autoMasterSqlPool = new sql.ConnectionPool({
      server: process.env.AZURE_SQL_SERVER,
      database: process.env.AZURE_SQL_DATABASE,
      port: Number(process.env.AZURE_SQL_PORT || 1433),
      authentication: { type: "azure-active-directory-default" },
      options: { encrypt: true, trustServerCertificate: false, appName: "Diangle AutoMaster" },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    }).connect().catch((error: unknown) => {
      globalSql.autoMasterSqlPool = undefined;
      throw error;
    });
  }
  return globalSql.autoMasterSqlPool;
}

export { sql };
