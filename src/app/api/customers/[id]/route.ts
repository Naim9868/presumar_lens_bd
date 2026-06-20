// src/app/api/customers/[id]/route.ts

import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

import Customer from '@/models/Customer';

// replace with your auth
async function requireAdmin() {
    return true;
}

function bad(message: string, status = 400) {
    return Response.json(
        { error: message },
        { status }
    );
}

export async function GET(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    await requireAdmin();

    const { id } =
        await params;

    if (
        !mongoose.Types.ObjectId.isValid(
            id
        )
    ) {
        return bad(
            'Invalid customer id'
        );
    }

    const customer =
        await Customer.findById(
            id
        ).lean();

    if (!customer) {
        return bad(
            'Customer not found',
            404
        );
    }

    return Response.json({
        customer,
    });
}



export async function PATCH(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    await requireAdmin();

    const { id } =
        await params;

    const body =
        await req.json();

    const update: any =
        {};

    if (
        body.name !==
        undefined
    ) {
        update.name =
            body.name;
    }

    if (
        body.email !==
        undefined
    ) {
        update.email =
            body.email;
    }

    if (
        body.phone !==
        undefined
    ) {
        update.phone =
            body.phone;
    }

    if (
        body.status !==
        undefined
    ) {
        update.status =
            body.status;
    }

    if (
        body.notifications
    ) {
        update.notifications =
            body.notifications;
    }

    if (
        body.addresses
    ) {
        update.addresses =
            body.addresses;
    }

    const customer =
        await Customer.findByIdAndUpdate(
            id,
            {
                $set:
                    update,
            },
            {
                new: true,
            }
        );

    if (!customer) {
        return bad(
            'Customer not found',
            404
        );
    }

    return Response.json({
        success:
            true,

        customer,
    });
}


export async function DELETE(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    await requireAdmin();

    const { id } =
        await params;

    const customer =
        await Customer.findByIdAndUpdate(
            id,
            {
                status:
                    'ARCHIVED',
            },
            {
                new: true,
            }
        );

    if (!customer) {
        return bad(
            'Customer not found',
            404
        );
    }

    return Response.json({
        success:
            true,

        message:
            'Customer archived',
    });
}

