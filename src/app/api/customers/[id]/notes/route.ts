// src/app/api/customers/[id]/notes/route.ts

import { NextRequest } from 'next/server';

import Customer from '@/models/Customer';
import { connectDB } from '@/lib/dbConnect';
import { CustomerNote } from '@/types/customer';
import { serializeNote } from '@/lib/serialize-customer';

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!OBJECT_ID_RE.test(id)) {
      return Response.json(
        {
          error: 'Invalid customer id',
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body?.text || typeof body.text !== 'string') {
      return Response.json(
        {
          error: 'Note text is required',
        },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return Response.json(
        {
          error: 'Customer not found',
        },
        { status: 404 }
      );
    }

    customer.notes.push({
      text: body.text,
      createdBy: 'ADMIN',
      createdAt: new Date(),
    } as CustomerNote);

    await customer.save();

    const notes = customer.notes.map(serializeNote);

    return Response.json({
      success: true,
      notes,
    });
  } catch (error: any) {
    console.error('Error adding customer note:', error);
    return Response.json(
      {
        error: 'Failed to add note',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!OBJECT_ID_RE.test(id)) {
      return Response.json({ error: 'Invalid customer id' }, { status: 400 });
    }

    const body = await req.json();

    if (!body?.noteId || typeof body.noteId !== 'string') {
      return Response.json(
        { error: 'noteId is required' },
        { status: 400 }
      );
    }

    if (!body?.text || typeof body.text !== 'string') {
      return Response.json(
        { error: 'Note text is required' },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const note = customer.notes.id(body.noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    note.text = body.text;

    await customer.save();

    return Response.json({
      success: true,
      note: serializeNote(note),
      notes: customer.notes.map(serializeNote),
    });
  } catch (error: any) {
    console.error('Error editing customer note:', error);
    return Response.json(
      {
        error: 'Failed to edit note',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!OBJECT_ID_RE.test(id)) {
      return Response.json({ error: 'Invalid customer id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const noteId =
      body?.noteId ??
      req.nextUrl.searchParams.get('noteId') ??
      undefined;

    if (!noteId || typeof noteId !== 'string') {
      return Response.json(
        { error: 'noteId is required' },
        { status: 400 }
      );
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    const note = customer.notes.id(noteId);

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    note.deleteOne();

    await customer.save();

    return Response.json({
      success: true,
      notes: customer.notes.map(serializeNote),
    });
  } catch (error: any) {
    console.error('Error deleting customer note:', error);
    return Response.json(
      {
        error: 'Failed to delete note',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}

