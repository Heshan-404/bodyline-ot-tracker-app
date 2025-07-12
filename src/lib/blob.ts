import { put } from '@vercel/blob';

export async function uploadImageToBlob(filename: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const blobData = new Blob([arrayBuffer], { type: file.type });

  const blob = await put(filename, blobData, {
    access: 'public',
    addRandomSuffix: true,
  });
  return blob.url;
}
