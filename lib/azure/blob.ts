import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, type BlockBlobClient } from "@azure/storage-blob";

function getContainerClient() {
  const containerName = process.env.AZURE_STORAGE_CONTAINER || "vehicle-images";
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) throw new Error("AZURE_STORAGE_ACCOUNT_NAME is not configured");
  return new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, new DefaultAzureCredential()).getContainerClient(containerName);
}

export async function uploadVehicleImage(blobName: string, data: Buffer, contentType: string) {
  const blob = getContainerClient().getBlockBlobClient(blobName);
  await blob.uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });
  return `/api/images/${encodeURIComponent(blobName)}`;
}

export function getVehicleBlob(blobName: string): BlockBlobClient {
  return getContainerClient().getBlockBlobClient(blobName);
}
