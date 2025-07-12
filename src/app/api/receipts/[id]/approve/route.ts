import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '@/src/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { role: userRole } = session.user;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    let newStatus = receipt.status;
    let newApproverRole = receipt.currentApproverRole;

    if (userRole === 'MGM' && receipt.currentApproverRole === 'MGM') {
      newStatus = 'APPROVED_BY_MGM_PENDING_GM';
      newApproverRole = 'GM';
    } else if (userRole === 'GM' && receipt.currentApproverRole === 'GM') {
      newStatus = 'APPROVED_BY_GM_PENDING_SECURITY';
      newApproverRole = 'SECURITY';
    } else if (
      userRole === 'SECURITY' &&
      receipt.currentApproverRole === 'SECURITY'
    ) {
      newStatus = 'APPROVED_FINAL';
      newApproverRole = null;
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id },
      data: {
        status: newStatus,
        currentApproverRole: newApproverRole,
        lastActionByRole: userRole,
      },
    });

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Error approving receipt:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
