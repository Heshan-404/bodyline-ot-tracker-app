
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    const users = await prisma.user.findMany({
      where: roleFilter ? { role: roleFilter as UserRole } : {},
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, role, email, sectionId } = await request.json();

    if (!username || !password || !role || !email) {
      return NextResponse.json(
        { message: 'Username, password, role, and email are required' },
        { status: 400 }
      );
    }

    if (role === 'MANAGER' && !sectionId) {
      return NextResponse.json(
        { message: 'Section is required for Manager role' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this username already exists' },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        ...(role === 'MANAGER' && { sectionId }),
      },
    });

    return NextResponse.json(
      { message: 'User registered successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
