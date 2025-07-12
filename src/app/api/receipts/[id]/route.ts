import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '@/src/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const awaitedParams = await params;
  const { id } = awaitedParams;

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

    // Basic authorization: HR can see their own, approvers can see pending, Security can see relevant ones.
    // More granular authorization can be added here based on the workflow.
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
