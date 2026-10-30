// src/services/settings.service.ts
import Setting from '@/models/Setting';
import crypto from 'node:crypto';

const ENCRYPTED_PREFIX = 'enc:v1:';

function encryptionKey() {
  const raw =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!raw) throw new Error('SETTINGS_ENCRYPTION_KEY is not configured');
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${cipher
    .getAuthTag()
    .toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(value: string) {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value;
  const [, ivText, tagText, encryptedText] = value.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivText, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tagText, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** Load all settings for a group as a flat key→value record */
export async function getSettings(group: string): Promise<Record<string, string>> {
  const docs = await Setting.find({ group }).lean();
  const out: Record<string, string> = {};
  docs.forEach((d) => {
    // Mask encrypted values on read (only expose whether they're set)
    out[d.key] = d.encrypted ? (d.value ? '••••••••' : '') : d.value;
  });
  return out;
}

/** Save / upsert many settings for a group at once.
 *  Pass `sensitiveKeys` array to mark those fields encrypted.
 */
export async function saveSettings(
  group: string,
  data: Record<string, string>,
  sensitiveKeys: string[] = []
): Promise<void> {
  const ops = Object.entries(data).map(([key, value]) => {
    // Don't overwrite encrypted value if user submitted the mask
    const isSensitive = sensitiveKeys.includes(key);
    const isMasked = value === '••••••••';
    if (isSensitive && isMasked) return null; // skip — unchanged

    return {
      updateOne: {
        filter: { group, key },
        update: { $set: { value: isSensitive ? encrypt(value) : value, encrypted: isSensitive } },
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (ops.length) {
    await Setting.bulkWrite(ops as Parameters<typeof Setting.bulkWrite>[0]);
  }
}

/** Raw get — actual values (server-side only, never send to client) */
export async function getRawSettings(group: string): Promise<Record<string, string>> {
  const docs = await Setting.find({ group }).lean();
  const out: Record<string, string> = {};
  docs.forEach((d) => { out[d.key] = d.encrypted ? decrypt(d.value) : d.value; });
  return out;
}
