

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

  const { id } = params;
  const { username, email, role } = await req.json();

  // HR can update any user's email. Only HR and Security can update roles.
  if (session.user.role === 'HR') {
    // HR can update email for any user
    if (email) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            email,
          },
        });
        return NextResponse.json(updatedUser);
      } catch (error) {
        console.error('Error updating user email:', error);
        return NextResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      }
    }
    // HR can also update roles, but only if they are not changing their own role
    if (role && session.user.id !== id) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            role,
          },
        });
        return NextResponse.json(updatedUser);
      } catch (error) {
        console.error('Error updating user role:', error);
        return NextResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  } else if (session.user.role === 'SECURITY') {
    // Security can update username, email, and role for any user
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          username,
          email,
          role,
        },
      });
      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ message: 'No valid fields provided for update' }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || !session.user.role) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

    // HR specific deletion logic
    if (session.user.role === 'HR') {
      // Check for associated receipts (written by, or acted upon)
      const associatedReceipts = await prisma.receipt.findFirst({
        where: {
          OR: [
            { writtenById: id },
            { dgmActionBy: id },
            { gmActionBy: id },
            { securityActionBy: id },
          ],
        },
      });

      if (associatedReceipts) {
        return NextResponse.json(
          {
            message:
              'Cannot delete user: associated with existing receipts (either written or acted upon).',
          },
          { status: 409 } // Conflict
        );
      }
    } else if (session.user.role !== 'SECURITY') {
      // Only HR and Security are allowed to delete users
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
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
