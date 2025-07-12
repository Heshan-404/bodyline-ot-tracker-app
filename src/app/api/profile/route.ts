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
    const { username, password } = await req.json();
    const userId = session.user.id;

    if (!username && !password) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    const updateData: { username?: string; passwordHash?: string } = {};

    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
      }
      updateData.username = username;
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, role: true }, // Select fields to return, exclude passwordHash
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
