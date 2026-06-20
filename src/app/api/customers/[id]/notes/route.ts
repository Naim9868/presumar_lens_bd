
// src/app/api/customers/[id]/notes/route.ts

import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

import Customer from '@/models/Customer';

// async function requireAdmin() {
//   return {
//     id:
//       undefined,
//   };
// }

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

//   const admin =
//     await requireAdmin();

  const { id } =
    await params;

  const body =
    await req.json();

  if (
    !body.text
  ) {
    return Response.json(
      {
        error:
          'Note required',
      },
      {
        status:
          400,
      }
    );
  }

  const customer =
    await Customer.findById(
      id
    );

  if (
    !customer
  ) {
    return Response.json(
      {
        error:
          'Customer not found',
      },
      {
        status:
          404,
      }
    );
  }

  customer.notes.push({
    text:
      body.text,

    createdBy: 'ADMIN',
    //   admin.id,

    createdAt:
      new Date(),
  });

  await customer.save();

  return Response.json({
    success:
      true,

    notes:
      customer.notes,
  });
}

