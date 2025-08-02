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

  if (!session || !session.user || session.user.role !== 'MANAGER') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params.params;
  const { action, rejectionReason } = await req.json();
  const { role: userRole, name: userName, id: userId } = session.user;

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        section: true,
        writtenBy: { select: { email: true, username: true } },
      },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    // Check if the manager belongs to the receipt's section
    const manager = await prisma.user.findUnique({
      where: { id: userId },
      select: { sectionId: true },
    });

    if (!manager || manager.sectionId !== receipt.sectionId) {
      return NextResponse.json({ message: 'Forbidden: Manager does not belong to this receipt\'s section' }, { status: 403 });
    }

    // Only allow action if receipt is pending manager approval
    if (receipt.status !== 'PENDING_MANAGER_APPROVAL') {
      return NextResponse.json({ message: 'Receipt is not pending manager approval' }, { status: 400 });
    }

    let newStatus: string;
    let newApproverRole: string | null;
    let updateData: any = { lastActionByRole: userRole };

    if (action === 'approve') {
      // Check if any other manager from the same section has already approved
      const otherManagersInSameSection = await prisma.user.findMany({
        where: {
          role: 'MANAGER',
          sectionId: receipt.sectionId,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      // For simplicity, if any manager approves, it moves forward.
      // More complex logic could involve tracking individual manager approvals.
      newStatus = 'APPROVED_BY_MANAGER_PENDING_DGM';
      newApproverRole = 'DGM';
      updateData.managerActionBy = userName;

      // Notify all DGMs
      const dgmUsers = await prisma.user.findMany({
        where: { role: 'DGM' },
        select: { email: true },
      });
      const dgmEmails = dgmUsers.map((user) => user.email);

      if (dgmEmails.length > 0) {
        console.log('Sending approval email to DGMs:', dgmEmails);
        const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
        const emailHtml = receiptActionTemplate({
          title: receipt.title,
          action: 'approved',
          role: userRole,
          actionBy: userName || 'Unknown',
          receiptLink,
        });
        await sendEmail({
          to: dgmEmails,
          subject: `Receipt Approved by Manager: ${receipt.title}`,
          html: emailHtml,
        });
      }

    } else if (action === 'reject') {
      newStatus = 'REJECTED_BY_MANAGER';
      newApproverRole = null;
      updateData.rejectionReason = rejectionReason || 'Rejected by Manager';
      updateData.managerActionBy = userName;

      // Notify HR user
      if (receipt.writtenBy.email) {
        console.log('Sending rejection email to HR:', receipt.writtenBy.email);
        const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
        const emailHtml = receiptActionTemplate({
          title: receipt.title,
          action: 'rejected',
          role: userRole,
          actionBy: userName || 'Unknown',
          rejectionReason: rejectionReason || undefined,
          receiptLink,
        });
        await sendEmail({
          to: receipt.writtenBy.email,
          subject: `Receipt Rejected by Manager: ${receipt.title}`,
          html: emailHtml,
        });
      }

    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id },
      data: {
        status: newStatus,
        currentApproverRole: newApproverRole,
        ...updateData,
      },
    });

    return NextResponse.json(updatedReceipt);
  } catch (error) {
    console.error('Error processing manager action:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
