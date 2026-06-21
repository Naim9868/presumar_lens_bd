// src/lib/serialize-customer.ts
// Shared serializer for Customer documents returned from server actions / API routes.
// Strips Mongoose internals so values are safe to pass into Client Components.

export function toIso(value: any): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  try {
    return new Date(value).toISOString();
  } catch {
    return undefined;
  }
}

export function serializeNote(note: any) {
  return {
    noteId: note._id ? note._id.toString() : undefined,
    text: note.text,
    createdBy: note.createdBy ? note.createdBy.toString() : 'ADMIN',
    createdAt: toIso(note.createdAt),
  };
}

export function serializeSms(sms: any) {
  return {
    message: sms.message,
    sentAt: toIso(sms.sentAt),
    type: sms.type,
    status: sms.status,
  };
}

export function serializeCustomer(customer: any) {
  if (!customer) return customer;
  return {
    ...customer,
    _id: customer._id?.toString?.() ?? customer._id,
    userId: customer.userId?.toString?.() ?? customer.userId,
    createdAt: toIso(customer.createdAt),
    updatedAt: toIso(customer.updatedAt),
    account: {
      ...(customer.account ?? {}),
      convertedAt: toIso(customer.account?.convertedAt),
    },
    stats: {
      ...(customer.stats ?? {}),
      firstOrderAt: toIso(customer.stats?.firstOrderAt),
      lastOrderAt: toIso(customer.stats?.lastOrderAt),
    },
    notes: (customer.notes || []).map(serializeNote),
    smsHistory: (customer.smsHistory || []).map(serializeSms),
  };
}
