import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { sendEmail } from '@/src/lib/email';
import { receiptActionTemplate } from '@/src/lib/emailTemplates/receiptAction';

export async function PUT(
  req: NextRequest,
  params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params.params;
  const { rejectionReason } = await req.json();
  const { role: userRole, name: userName } = session.user;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    let newStatus = receipt.status;

    if (userRole === 'DGM' && receipt.currentApproverRole === 'DGM') {
      newStatus = 'REJECTED_BY_DGM';
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
        ...(userRole === 'DGM' && { dgmActionBy: userName }),
        ...(userRole === 'GM' && { gmActionBy: userName }),
      },
      include: {
        writtenBy: { select: { email: true, username: true } },
      },
    });

    // Email HR user
    if (updatedReceipt.writtenBy.email) {
      const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${updatedReceipt.id}`;
      const emailHtml = receiptActionTemplate({
        title: updatedReceipt.title,
        action: 'rejected',
        role: userRole,
        actionBy: userName || 'Unknown',
        rejectionReason: rejectionReason || undefined,
        receiptLink,
      });
      await sendEmail({
        to: updatedReceipt.writtenBy.email,
        subject: `Receipt Rejected by ${userRole}: ${updatedReceipt.title}`,
        html: emailHtml,
      });
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Error rejecting receipt:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
