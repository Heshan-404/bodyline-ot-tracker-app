import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getServerSession, AuthOptions } from "next-auth";
import { authOptions } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/src/lib/email';

export async function PUT(
  req: NextRequest,
  params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || !session.user.id || !session.user.role) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id: receiptId } = params;
  const { action, rejectionReason } = await req.json();
  const userRole = session.user.role;
    const userName = session.user.name; // Use session.user.name as username is not available

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    let newStatus: string;
    let newCurrentApproverRole: string | null;
    let updateData: any = { lastActionByRole: userRole };

    switch (userRole) {
      case 'MGM':
        if (receipt.status !== 'PENDING_MGM') {
          return NextResponse.json({ message: 'Invalid status for MGM action' }, { status: 400 });
        }
        if (action === 'approve') {
          newStatus = 'APPROVED_BY_MGM_PENDING_GM';
          newCurrentApproverRole = 'GM';
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_MGM';
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by MGM';
        } else {
          return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        break;
      case 'DGM':
        if (receipt.status !== 'PENDING_DGM') {
          return NextResponse.json({ message: 'Invalid status for DGM action' }, { status: 400 });
        }
        if (action === 'approve') {
          newStatus = 'APPROVED_BY_DGM_PENDING_GM';
          newCurrentApproverRole = 'GM';
          updateData.dgmActionBy = userName;
          // Notify all DGMs
          const dgmUsers = await prisma.user.findMany({
            where: { role: 'DGM' },
            select: { email: true },
          });
          const dgmEmails = dgmUsers.map((user) => user.email);

          if (dgmEmails.length > 0) {
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>Dear DGM,</p>
              <p>A receipt titled "<strong>${receipt.title}</strong>" has been approved by a DGM.</p>
              <p>Description: ${receipt.description || 'N/A'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: dgmEmails,
              subject: `Receipt Approved by DGM: ${receipt.title}`,
              html: emailHtml,
            });
          }
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_DGM';
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by DGM';
          updateData.dgmActionBy = userName;
        } else {
          return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        break;
      case 'GM':
        if (receipt.status !== 'APPROVED_BY_DGM_PENDING_GM') {
          return NextResponse.json({ message: 'Invalid status for GM action' }, { status: 400 });
        }
        if (action === 'approve') {
          newStatus = 'APPROVED_FINAL';
          newCurrentApproverRole = null;
          updateData.gmActionBy = userName;
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_GM';
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by GM';
          updateData.gmActionBy = userName;
        } else {
          return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        break;
      case 'SECURITY':
        if (receipt.status !== 'APPROVED_BY_GM_PENDING_SECURITY') {
          return NextResponse.json({ message: 'Invalid status for Security action' }, { status: 400 });
        }
        if (action === 'approve') {
          newStatus = 'APPROVED_FINAL';
          newCurrentApproverRole = null;
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_GM'; // Using existing rejection status
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by Security';
        } else {
          return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
        }
        break;
      default:
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: newStatus,
        currentApproverRole: newCurrentApproverRole,
        ...updateData,
      },
    });

    // Revalidate paths
    revalidatePath(`/receipts/${receiptId}`);
    revalidatePath(`/dashboard`); // Revalidate general dashboard
    revalidatePath(`/dashboard/${userRole.toLowerCase()}`); // Revalidate specific role dashboard

    return NextResponse.json(updatedReceipt, { status: 200 });
  } catch (error) {
    console.error('Error updating receipt status:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
