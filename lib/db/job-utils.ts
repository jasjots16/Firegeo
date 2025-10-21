import { db } from './index';
import { brandAnalyses, aeoReports, fileGenerationJobs } from './schema';
import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export type WorkflowTable = 'brand_analyses' | 'aeo_reports' | 'file_generation_jobs';

export function normalizeUrlForJobKey(rawUrl: string): string {
  try {
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    const path = u.pathname.replace(/\/$/, '');
    const normalized = `${u.protocol}//${host}${path}${u.search ? u.search : ''}`;
    return normalized;
  } catch {
    return rawUrl.trim();
  }
}

async function getLatestJobRowForUrl(normalizedUrl: string) {
  const [bm] = await db.select({ jobId: brandAnalyses.jobId, createdAt: brandAnalyses.createdAt })
    .from(brandAnalyses)
    .where(eq(brandAnalyses.url, normalizedUrl))
    .orderBy(desc(brandAnalyses.createdAt))
    .limit(1);

  const [aeo] = await db.select({ jobId: aeoReports.jobId, createdAt: aeoReports.createdAt })
    .from(aeoReports)
    .where(eq(aeoReports.url, normalizedUrl))
    .orderBy(desc(aeoReports.createdAt))
    .limit(1);

  const [files] = await db.select({ jobId: fileGenerationJobs.jobId, createdAt: fileGenerationJobs.createdAt })
    .from(fileGenerationJobs)
    .where(eq(fileGenerationJobs.url, normalizedUrl))
    .orderBy(desc(fileGenerationJobs.createdAt))
    .limit(1);

  const candidates = [bm, aeo, files].filter(Boolean) as Array<{ jobId: string; createdAt: Date }>;
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return candidates[0];
}

async function tableHasJobId(table: WorkflowTable, jobId: string, normalizedUrl: string): Promise<boolean> {
  if (table === 'brand_analyses') {
    const [row] = await db.select({ id: brandAnalyses.id })
      .from(brandAnalyses)
      .where(eq(brandAnalyses.jobId, jobId))
      .limit(1);
    return !!row;
  }
  if (table === 'aeo_reports') {
    const [row] = await db.select({ id: aeoReports.id })
      .from(aeoReports)
      .where(eq(aeoReports.jobId, jobId))
      .limit(1);
    return !!row;
  }
  if (table === 'file_generation_jobs') {
    const [row] = await db.select({ id: fileGenerationJobs.id })
      .from(fileGenerationJobs)
      .where(eq(fileGenerationJobs.jobId, jobId))
      .limit(1);
    return !!row;
  }
  return false;
}

export async function getOrCreateJobIdForWorkflow(rawUrl: string, requestedTable: WorkflowTable): Promise<{ jobId: string; url: string }> {
  const url = normalizeUrlForJobKey(rawUrl);
  const latest = await getLatestJobRowForUrl(url);

  if (!latest) {
    return { jobId: randomUUID(), url };
  }

  const alreadyInRequested = await tableHasJobId(requestedTable, latest.jobId, url);
  if (alreadyInRequested) {
    // Start a fresh job for same workflow on the same URL
    return { jobId: randomUUID(), url };
  }

  // Reuse the latest job for this URL for a different workflow
  return { jobId: latest.jobId as string, url };
}
