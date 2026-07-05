import type { Express } from 'express';
import { supabase } from '../lib/supabase.js';

const BUCKET = 'proof-screenshots';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadProof(
  groupId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('Only image files are allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File must be under 5MB');
  }

  const ext = file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : file.mimetype.split('/')[1];
  const path = `${groupId}/${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new Error(error.message);

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (!signed?.signedUrl) throw new Error('Failed to create signed URL');

  return path;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? path;
}
