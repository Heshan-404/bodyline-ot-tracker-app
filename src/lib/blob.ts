import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImageToBlob(filename: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const blobData = new Blob([arrayBuffer], { type: file.type });
  const randomFilename = `${uuidv4()}-${filename}`;

  const blob = await put(randomFilename, blobData, {
    access: 'public',
    addRandomSuffix: false, // No longer needed as we have a unique filename
  });
  return blob.url;
}
