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

  const { id: receiptId } = params.params;
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
      case 'DGM':
        if (receipt.status !== 'APPROVED_BY_MANAGER_PENDING_DGM') {
          return NextResponse.json({ message: 'Invalid status for DGM action' }, { status: 400 });
        }
        if (action === 'approve') {
          newStatus = 'APPROVED_BY_DGM_PENDING_GM';
          newCurrentApproverRole = 'GM';
          updateData.dgmActionBy = userName;
          // Notify HR user
          const hrUser = await prisma.user.findUnique({
            where: { id: receipt.writtenById },
            select: { email: true, username: true },
          });

          if (hrUser?.email) {
            console.log('Sending DGM approval email to HR:', hrUser.email);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>Dear ${hrUser.username},</p>
              <p>Your receipt titled "<strong>${receipt.title}</strong>" has been approved by a DGM.</p>
              <p>Description: ${receipt.description || 'N/A'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: hrUser.email,
              subject: `Receipt Approved by DGM: ${receipt.title}`,
              html: emailHtml,
            });
          }

          // Notify all GMs
          const gmUsers = await prisma.user.findMany({
            where: { role: 'GM' },
            select: { email: true },
          });
          const gmEmails = gmUsers.map((user) => user.email);

          if (gmEmails.length > 0) {
            console.log('Sending DGM approval email to GMs:', gmEmails);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>A receipt titled "<strong>${receipt.title}</strong>" has been approved by a DGM and is now pending your approval.</p>
              <p>Description: ${receipt.description || 'N/A'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: gmEmails,
              subject: `Receipt Pending GM Approval: ${receipt.title}`,
              html: emailHtml,
            });
          }
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_DGM';
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by DGM';
          updateData.dgmActionBy = userName;
          // Notify HR user
          const hrUser = await prisma.user.findUnique({
            where: { id: receipt.writtenById },
            select: { email: true, username: true },
          });

          if (hrUser?.email) {
            console.log('Sending DGM rejection email to HR:', hrUser.email);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>Dear ${hrUser.username},</p>
              <p>Your receipt titled "<strong>${receipt.title}</strong>" has been rejected by a DGM.</p>
              <p>Reason: ${rejectionReason || 'No reason provided.'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: hrUser.email,
              subject: `Receipt Rejected by DGM: ${receipt.title}`,
              html: emailHtml,
            });
          }
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
          // Notify HR user
          const hrUser = await prisma.user.findUnique({
            where: { id: receipt.writtenById },
            select: { email: true, username: true },
          });

          if (hrUser?.email) {
            console.log('Sending GM approval email to HR:', hrUser.email);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>Dear ${hrUser.username},</p>
              <p>Your receipt titled "<strong>${receipt.title}</strong>" has been approved by a GM.</p>
              <p>Description: ${receipt.description || 'N/A'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: hrUser.email,
              subject: `Receipt Approved by GM: ${receipt.title}`,
              html: emailHtml,
            });
          }
        } else if (action === 'reject') {
          newStatus = 'REJECTED_BY_GM';
          newCurrentApproverRole = null;
          updateData.rejectionReason = rejectionReason || 'Rejected by GM';
          updateData.gmActionBy = userName;
          // Notify HR user
          const hrUser = await prisma.user.findUnique({
            where: { id: receipt.writtenById },
            select: { email: true, username: true },
          });

          if (hrUser?.email) {
            console.log('Sending GM rejection email to HR:', hrUser.email);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${receipt.id}`;
            const emailHtml = `
              <p>Dear ${hrUser.username},</p>
              <p>Your receipt titled "<strong>${receipt.title}</strong>" has been rejected by a GM.</p>
              <p>Reason: ${rejectionReason || 'No reason provided.'}</p>
              <p>You can view the details here: <a href="${receiptLink}">${receiptLink}</a></p>
              <p>Thank you.</p>
            `;
            await sendEmail({
              to: hrUser.email,
              subject: `Receipt Rejected by GM: ${receipt.title}`,
              html: emailHtml,
            });
          }
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