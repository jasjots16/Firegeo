import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aeoReports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return new NextResponse('AEO Report ID is required', { status: 400 });
    }

    const report = await db.select().from(aeoReports).where(eq(aeoReports.id, id)).limit(1);

    if (report.length === 0) {
      return new NextResponse('AEO Report not found', { status: 404 });
    }

    const aeoReport = report[0];

    if (!aeoReport.html) {
      return new NextResponse('AEO Report is still being processed. Please check back later.', { status: 202 });
    }

    return new NextResponse(aeoReport.html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (e) {
    console.error('Failed to retrieve AEO report', e);
    return new NextResponse('Failed to retrieve AEO report', { status: 500 });
  }
}
