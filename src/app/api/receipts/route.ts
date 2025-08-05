import {NextRequest, NextResponse} from 'next/server';
import prisma from '../../../lib/prisma';
import {authOptions} from '@/src/lib/auth';
import {uploadImageToBlob} from '@/src/lib/blob';
import {getServerSession, AuthOptions} from "next-auth";
import {sendEmail} from '@/src/lib/email';
import {newReceiptTemplate} from '@/src/lib/emailTemplates/newReceipt';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session || !session.user) {
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    const {role, id: userId} = session.user;
    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const view = searchParams.get('view'); // New parameter

    let whereClause: any = {};

    if (view === 'history') {
        if (statusFilter) {
            whereClause.status = statusFilter;
        } else {
            switch (role) {
                case 'DGM':
                    whereClause.status = {in: ['REJECTED_BY_DGM', 'APPROVED_BY_DGM_PENDING_GM', 'APPROVED_FINAL']};
                    break;
                case 'GM':
                    whereClause.status = {in: ['REJECTED_BY_GM', 'APPROVED_FINAL']};
                    break;
                case 'HR':
                    whereClause.writtenById = userId;
                    break;
                case 'MANAGER':
                    whereClause.sectionId = session.user.sectionId;
                    break;
                case 'SECURITY':
                    // Security can view all receipts
                    break;
                default:
                    return NextResponse.json({message: 'Forbidden'}, {status: 403});
            }
        }
    } else if (statusFilter) {
        whereClause.status = statusFilter;
    } else {
        // Default dashboard view (pending receipts)
        switch (role) {
            case 'HR':
                whereClause.writtenById = userId;
                break;
            case 'MANAGER':
                whereClause.status = 'PENDING_MANAGER_APPROVAL';
                whereClause.sectionId = session.user.sectionId; // Assuming sectionId is available in session
                break;
            case 'DGM':
                whereClause.status = 'APPROVED_BY_MANAGER_PENDING_DGM';
                break;
            case 'GM':
                whereClause.status = 'APPROVED_BY_DGM_PENDING_GM';
                break;
            default:
                return NextResponse.json({message: 'Forbidden'}, {status: 403});
        }
    }

    // If the user is a manager, filter by their sectionId
    if (role === 'MANAGER' && session.user.sectionId) {
        whereClause.sectionId = session.user.sectionId;
    }

    console.log(`Fetching receipts for role: ${role}, view: ${view}, whereClause:`, whereClause);
    try {
        const receipts = await prisma.receipt.findMany({
            where: whereClause,
            include: {
                writtenBy: {select: {username: true, role: true}},
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log('Receipts fetched for history:', receipts);
        return NextResponse.json(receipts);
    } catch (error) {
        console.error('Error fetching receipts:', error);
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        );
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session || session.user.role !== 'HR') {
        console.log('Unauthorized access attempt: Session:', session, 'User Role:', session?.user?.role);
        return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    try {
        const formData = await req.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File;
        const sectionId = formData.get('sectionId') as string;
        console.log(title)
        console.log(title)
        console.log(imageFile)
        console.log(sectionId)
        if (!title || !imageFile || !sectionId) {
            return NextResponse.json(
                {message: 'Missing required fields: title, image, or section'},
                {status: 400}
            );
        }

        console.log('Checking session.user.id:', session?.user?.id);
        if (!session.user || !session.user.id) {
            return NextResponse.json({message: 'User not authenticated'}, {status: 401});
        }

        const imageUrl = await uploadImageToBlob(imageFile.name, imageFile);

        const newReceipt = await prisma.receipt.create({
            data: {
                title,
                description,
                imageUrl,
                writtenById: session.user.id,
                sectionId,
                status: 'PENDING_MANAGER_APPROVAL',
                currentApproverRole: 'MANAGER',
            },
        });
        console.log(newReceipt)
        // Send email to all Managers in the selected section
        const managersInSection = await prisma.user.findMany({
            where: {role: 'MANAGER', sectionId: sectionId},
            select: {email: true},
        });
        const managerEmails = managersInSection.map((user) => user.email);

        if (managerEmails.length > 0) {
            console.log('Sending new receipt email to managers:', managerEmails);
            const receiptLink = `${process.env.NEXTAUTH_URL}/receipts/${newReceipt.id}`;
            const emailHtml = newReceiptTemplate({
                title: newReceipt.title,
                description: newReceipt.description || '',
                receiptLink,
            });
            await sendEmail({
                to: managerEmails,
                subject: `New Receipt for Your Approval: ${newReceipt.title}`,
                html: emailHtml,
            });
        }

        return NextResponse.json(newReceipt, {status: 201});
    } catch (error) {
        console.error('Error creating receipt:', error);
        return NextResponse.json(
            {message: 'Internal Server Error'},
            {status: 500}
        );
    }
}