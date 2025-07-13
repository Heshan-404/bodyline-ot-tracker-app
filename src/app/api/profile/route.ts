import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession, AuthOptions } from "next-auth";
import { revalidatePath } from 'next/cache';
import {authOptions} from "@/src/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions as AuthOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, currentPassword } = await req.json();
    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if any sensitive fields are being updated (password or email)
    const isPasswordChange = !!password;
    const isEmailChange = email && email !== user.email;

    if (isPasswordChange || isEmailChange) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'Current password is required to change email or password' }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ message: 'Invalid current password' }, { status: 401 });
      }
    }

    const updateData: { email?: string; passwordHash?: string } = {};

    if (isEmailChange) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
        return NextResponse.json({ message: 'Email already taken' }, { status: 409 });
      }
      updateData.email = email;
    }

    if (isPasswordChange) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (!isEmailChange && !isPasswordChange) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, email: true, role: true },
    });

    revalidatePath('/profile');
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
