import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { del } from '@vercel/blob';

// GET handler for fetching a receipt by ID
export async function GET(
    request: NextRequest,
    params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        writtenBy: { select: { username: true, role: true } },
      },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    const { role, id: userId } = session.user;

    if (
        role === 'HR' &&
        receipt.writtenById !== userId &&
        receipt.status !== 'APPROVED_FINAL' &&
        receipt.status !== 'REJECTED_BY_MGM' &&
        receipt.status !== 'REJECTED_BY_GM'
    ) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
    );
  }
}

// DELETE handler for deleting a receipt by ID
export async function DELETE(
    request: NextRequest,
    params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || session.user.role !== 'HR') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const userId = session.user.id;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    if (session.user.role !== 'HR' || receipt.status !== 'PENDING_DGM') {
      return NextResponse.json(
          { message: 'Forbidden: Only HR can delete receipts, and only if their status is PENDING_DGM.' },
          { status: 403 }
      );
    }

    if (receipt.imageUrl) {
      await del(receipt.imageUrl);
    }

    await prisma.receipt.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Receipt deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
    );
  }
}