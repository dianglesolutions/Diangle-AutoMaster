# Diangle AutoMaster

A car marketplace and dealership workspace built with Azure services. The public storefront provides searchable vehicle inventory, vehicle detail pages and customer enquiries. The protected workspace manages vehicle listings, availability, photos and incoming leads.

## Azure stack

- **Microsoft Entra ID + App Service Authentication (Easy Auth)** for organization sign-in
- **Azure SQL Database** for vehicle listings and customer enquiries
- **Azure Blob Storage** for private vehicle image files, served through the app
- **Azure Managed Identity** for passwordless access to SQL and Blob Storage
- **Azure App Service** for the Next.js server

## Azure setup

1. Create an Azure SQL logical server and database. Set a Microsoft Entra administrator on the SQL server.
2. Run [`azure/sql/001_initial_schema.sql`](azure/sql/001_initial_schema.sql) against the new database.
3. Create an Azure Storage account with a private blob container named `vehicle-images` (or set a different container name in App Service settings). Leave anonymous blob access disabled.
4. Deploy this Next.js app to Azure App Service on Node.js 22 or newer. Enable its system-assigned managed identity.
5. Grant the App Service identity the **Storage Blob Data Contributor** role on the storage account.
6. In the SQL database, create a database user for the App Service managed identity and grant only runtime data access:

   ```sql
   CREATE USER [YOUR_APP_SERVICE_NAME] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [YOUR_APP_SERVICE_NAME];
   ALTER ROLE db_datawriter ADD MEMBER [YOUR_APP_SERVICE_NAME];
   ```

   Run the schema migration separately as a database administrator. The app identity does not need schema-owner or DDL permissions.

7. Configure **App Service Authentication** with Microsoft Entra ID. Register or select a single-tenant Entra application, set the issuer to `https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0`, and add the App Service callback URL ending in `/.auth/login/aad/callback`. Allow unauthenticated requests so the public storefront remains public; the app protects `/admin` by checking the authenticated principal.
8. Add these App Service application settings:

   | Setting | Value |
   | --- | --- |
   | `AZURE_EASY_AUTH_ENABLED` | `true` |
   | `ADMIN_EMAILS` | Comma-separated exact administrator email addresses |
   | `ADMIN_DISPLAY_NAME` | `GRUID` |
   | `AZURE_SQL_SERVER` | `<server-name>.database.windows.net` |
   | `AZURE_SQL_DATABASE` | `AutoMaster` (or your database name) |
   | `AZURE_SQL_PORT` | `1433` |
   | `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name, without a URL |
   | `AZURE_STORAGE_CONTAINER` | `vehicle-images` |

   Add the administrator's organization email to `ADMIN_EMAILS`. The dashboard uses `ADMIN_DISPLAY_NAME` as its greeting.

## Local development

1. Install Node.js 22 or newer and Azure CLI.
2. Copy `.env.example` to `.env.local` and set the SQL server/database and storage account names. Set `ADMIN_EMAILS` to your organization account and leave `AZURE_EASY_AUTH_ENABLED=false`; Azure Easy Auth is only available after deployment to App Service.
3. Sign in to Azure CLI with `az login`. Grant your Entra user data-reader and data-writer access to the Azure SQL database, and **Storage Blob Data Contributor** on the storage account.
4. Install dependencies and run the app:

   ```bash
   npm install
   npm run dev
   ```

The storefront uses a small demo collection only when Azure SQL settings are absent. Once connected, it displays the actual SQL inventory, including an empty state for a new database. Admin pages and customer enquiry persistence require Azure SQL. Blob uploads require Azure credentials and the configured sto