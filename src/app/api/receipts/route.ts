import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { authOptions } from '@/src/lib/auth';
import { uploadImageToBlob } from '@/src/lib/blob';
import { getServerSession, AuthOptions } from "next-auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  const searchParams = req.nextUrl.searchParams;
  const statusFilter = searchParams.get('status');
  const view = searchParams.get('view'); // New parameter

  let whereClause: any = {};

  if (statusFilter) {
    whereClause.status = statusFilter;
  } else if (view === 'history') {
    switch (role) {
      case 'MGM':
        whereClause.OR = [
          { status: 'APPROVED_BY_MGM_PENDING_GM', lastActionByRole: 'MGM' },
          { status: 'REJECTED_BY_MGM', lastActionByRole: 'MGM' },
          { status: 'APPROVED_FINAL', lastActionByRole: 'MGM' },
        ];
        break;
      case 'GM':
        whereClause.OR = [
          { status: 'APPROVED_BY_GM_PENDING_SECURITY', lastActionByRole: 'GM' },
          { status: 'REJECTED_BY_GM', lastActionByRole: 'GM' },
          { status: 'APPROVED_FINAL', lastActionByRole: 'GM' },
        ];
        break;
      case 'HR':
        whereClause.writtenById = userId;
        break;
      case 'SECURITY':
        whereClause.OR = [
          { status: 'REJECTED_BY_MGM' },
          { status: 'REJECTED_BY_GM' },
          { status: 'APPROVED_BY_MGM_PENDING_GM' },
          { status: 'APPROVED_BY_GM_PENDING_SECURITY' },
          { status: 'APPROVED_FINAL' },
        ];
        whereClause.NOT = { status: 'PENDING_MGM' };
        break;
      default:
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  } else {
    // Default dashboard view (pending receipts)
    switch (role) {
      case 'HR':
        whereClause.writtenById = userId;
        break;
      case 'MGM':
        whereClause.status = 'PENDING_MGM';
        break;
      case 'GM':
        whereClause.status = 'APPROVED_BY_MGM_PENDING_GM';
        break;
      case 'SECURITY':
        whereClause.OR = [
          { status: 'REJECTED_BY_MGM' },
          { status: 'REJECTED_BY_GM' },
          { status: 'APPROVED_BY_MGM_PENDING_GM' },
          { status: 'APPROVED_BY_GM_PENDING_SECURITY' },
          { status: 'APPROVED_FINAL' },
        ];
        whereClause.NOT = { status: 'PENDING_MGM' };
        break;
      default:
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: whereClause,
      include: {
        writtenBy: { select: { username: true, role: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || session.user.role !== 'HR') {
    console.log('Unauthorized access attempt: Session:', session, 'User Role:', session?.user?.role);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File;

    if (!title || !imageFile) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Checking session.user.id:', session?.user?.id);
    if (!session.user || !session.user.id) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const imageUrl = await uploadImageToBlob(imageFile.name, imageFile);

    const newReceipt = await prisma.receipt.create({
      data: {
        title,
        description,
        imageUrl,
        writtenById: session.user.id,
        status: 'PENDING_MGM',
        currentApproverRole: 'MGM',
      },
    });

    return NextResponse.json(newReceipt, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
