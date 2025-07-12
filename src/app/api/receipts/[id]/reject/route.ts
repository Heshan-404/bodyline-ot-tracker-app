import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { rejectionReason } = await req.json();
  const { role: userRole } = session.user;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    let newStatus = receipt.status;

    if (userRole === 'MGM' && receipt.currentApproverRole === 'MGM') {
      newStatus = 'REJECTED_BY_MGM';
    } else if (userRole === 'GM' && receipt.currentApproverRole === 'GM') {
      newStatus = 'REJECTED_BY_GM';
    } else {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id },
      data: {
        status: newStatus,
        currentApproverRole: null,
        lastActionByRole: userRole,
        rejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Error rejecting receipt:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
