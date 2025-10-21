import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { brandAnalyses } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getOrCreateJobIdForWorkflow, normalizeUrlForJobKey } from '@/lib/db/job-utils';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/api-errors';
import { executeWithRetry } from '@/lib/db/utils';

// GET /api/brand-monitor/analyses - Get user's brand analyses
export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to view your analyses');
    }

    const analyses = await executeWithRetry(async () => {
      return await db.query.brandAnalyses.findMany({
        where: eq(brandAnalyses.userId, sessionResponse.user.id),
        orderBy: desc(brandAnalyses.createdAt),
      });
    });

    return NextResponse.json(analyses);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/brand-monitor/analyses - Save a new brand analysis
export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to save analyses');
    }

    const body = await request.json();
    
    if (!body.url || !body.analysisData) {
      throw new ValidationError('Invalid request', {
        url: body.url ? undefined : 'URL is required',
        analysisData: body.analysisData ? undefined : 'Analysis data is required',
      });
    }

    const normalizedUrl = normalizeUrlForJobKey(body.url);
    // Determine jobId per latest-per-url rule if not provided
    const resolved = body.jobId ? { jobId: body.jobId, url: normalizedUrl } : await getOrCreateJobIdForWorkflow(normalizedUrl, 'brand_analyses');

    // If a brand analysis already exists for (url, jobId), mint a new jobId
    const existing = await db.query.brandAnalyses.findFirst({
      where: and(eq(brandAnalyses.url, normalizedUrl), eq(brandAnalyses.jobId, resolved.jobId))
    });
    const jobIdToUse = existing ? (await getOrCreateJobIdForWorkflow(normalizedUrl, 'brand_analyses')).jobId : resolved.jobId;

    const [analysis] = await executeWithRetry(async () => {
      return await db.insert(brandAnalyses).values({
        userId: sessionResponse.user.id,
        url: normalizedUrl,
        jobId: jobIdToUse,
        companyName: body.companyName,
        industry: body.industry,
        analysisData: body.analysisData,
        competitors: body.competitors,
        prompts: body.prompts,
        creditsUsed: body.creditsUsed || 10,
      }).returning();
    });

    return NextResponse.json(analysis);
  } catch (error) {
    return handleApiError(error);
  }
}