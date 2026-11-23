import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const standaloneDir = resolve(".next/standalone");
const serverFile = resolve(standaloneDir, "server.js");

if (!existsSync(serverFile)) {
  throw new Error("Next.js standalone server was not generated.");
}

function copyIfPresent(source, destination) {
  if (!existsSync(source)) return;
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

copyIfPresent(resolve(".next/static"), resolve(standaloneDir, ".next/static"));
copyIfPresent(resolve("public"), resolve(standaloneDir, "public"));
console.log("Prepared the self-contained Next.js server for Azure App Service.");
