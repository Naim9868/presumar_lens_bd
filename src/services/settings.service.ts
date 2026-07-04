// src/services/settings.service.ts
import Setting from '@/models/Setting';

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
        update: { $set: { value, encrypted: isSensitive } },
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
  docs.forEach((d) => { out[d.key] = d.value; });
  return out;
}
