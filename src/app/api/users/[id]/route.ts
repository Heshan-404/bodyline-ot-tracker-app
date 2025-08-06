

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getServerSession, AuthOptions } from 'next-auth';
import { authOptions } from '@/src/lib/auth';

export async function PUT(
  req: NextRequest,
  params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || !session.user.role) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params.params;
  const { username, email, role, sectionId } = await req.json();

  // HR can update any user's email. Only HR and Security can update roles.
  if (session.user.role !== 'HR') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const updateData: any = {};

  if (email) {
    updateData.email = email;
  }
  if (role) {
    updateData.role = role;
    // Only set sectionId if the role is MANAGER, otherwise ensure it's null
    if (role === 'MANAGER') {
      updateData.sectionId = sectionId;
    } else {
      updateData.sectionId = null;
    }
  } else if (sectionId) { // If role is not being updated, but sectionId is provided
    // This case handles updating sectionId for an existing manager without changing their role
    updateData.sectionId = sectionId;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  params: any
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || !session.user.role) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params.params;

  // Prevent a user from deleting themselves
  if (session.user.id === id) {
    return NextResponse.json(
      { message: 'Cannot delete your own account' },
      { status: 400 }
    );
  }

  try {
    // Check if the user to be deleted exists
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true }, // We only need the role of the user being deleted
    });

    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (session.user.role !== 'HR') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Check for associated receipts (written by)
    const associatedReceipts = await prisma.receipt.findFirst({
      where: {
        writtenById: id,
      },
    });

    if (associatedReceipts) {
      return NextResponse.json(
        {
          message:
            'Cannot delete user: associated with existing receipts.',
        },
        { status: 409 } // Conflict
      );
    }

    // Proceed with deletion
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
