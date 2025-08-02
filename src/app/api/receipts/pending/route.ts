
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SECURITY') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        status: {
          in: ['PENDING_MANAGER_APPROVAL', 'APPROVED_BY_MANAGER_PENDING_DGM', 'PENDING_DGM', 'APPROVED_BY_DGM_PENDING_GM', 'REJECTED_BY_MANAGER', 'REJECTED_BY_DGM', 'REJECTED_BY_GM'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(receipts);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
