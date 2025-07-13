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

  const { id } = params as { id: string };
  const { role: userRole, username: userName } = session.user;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    let newStatus = receipt.status;
    let newApproverRole = receipt.currentApproverRole;

    if (userRole === 'DGM' && receipt.currentApproverRole === 'DGM') {
      newStatus = 'APPROVED_BY_DGM_PENDING_GM';
      newApproverRole = 'GM';
    } else if (userRole === 'GM' && receipt.currentApproverRole === 'GM') {
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
        ...(userRole === 'DGM' && { dgmActionBy: userName }),
        ...(userRole === 'GM' && { gmActionBy: userName }),
      },
      include: {
        writtenBy: { select: { email: true, username: true } },
      },
    });

    const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${updatedReceipt.id}`;

    if (userRole === 'DGM') {
      // Email all GMs
      const gmUsers = await prisma.user.findMany({
        where: { role: 'GM' },
        select: { email: true },
      });
      const gmEmails = gmUsers.map((user) => user.email);

      if (gmEmails.length > 0) {
        const emailHtml = receiptActionTemplate({
          title: updatedReceipt.title,
          action: 'approved',
          role: userRole,
          actionBy: userName || 'Unknown',
          receiptLink,
        });
        await sendEmail({
          to: gmEmails,
          subject: `Receipt Approved by DGM: ${updatedReceipt.title}`,
          html: emailHtml,
        });
      }
    } else if (userRole === 'GM') {
      // Email HR user
      if (updatedReceipt.writtenBy.email) {
        const emailHtml = receiptActionTemplate({
          title: updatedReceipt.title,
          action: 'approved',
          role: userRole,
          actionBy: userName || 'Unknown',
          receiptLink,
        });
        await sendEmail({
          to: updatedReceipt.writtenBy.email,
          subject: `Receipt Approved by GM: ${updatedReceipt.title}`,
          html: emailHtml,
        });
      }
    }

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Error approving receipt:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
