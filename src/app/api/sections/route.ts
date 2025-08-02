import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Section name is required' },
        { status: 400 }
      );
    }

    const existingSection = await prisma.section.findUnique({ where: { name } });
    if (existingSection) {
      return NextResponse.json(
        { message: 'Section with this name already exists' },
        { status: 409 }
      );
    }

    const newSection = await prisma.section.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name } = await req.json();

    if (!id || !name) {
      return NextResponse.json(
        { message: 'Section ID and name are required' },
        { status: 400 }
      );
    }

    const existingSection = await prisma.section.findUnique({ where: { name } });
    if (existingSection && existingSection.id !== id) {
      return NextResponse.json(
        { message: 'Section with this name already exists' },
        { status: 409 }
      );
    }

    const updatedSection = await prisma.section.update({
      where: { id },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedSection, { status: 200 });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Check if any users are associated with this section
    const associatedUsers = await prisma.user.findFirst({
      where: { sectionId: id },
    });

    if (associatedUsers) {
      return NextResponse.json(
        { message: 'Cannot delete section: Users are associated with it' },
        { status: 409 }
      );
    }

    // Check if any receipts are associated with this section
    const associatedReceipts = await prisma.receipt.findFirst({
      where: { sectionId: id },
    });

    if (associatedReceipts) {
      return NextResponse.json(
        { message: 'Cannot delete section: Receipts are associated with it' },
        { status: 409 }
      );
    }

    await prisma.section.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Section deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}