import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Autumn } from 'autumn-js';
import { scrapeCompanyInfo } from '@/lib/scrape-utils';
import { generatePromptsForCompany } from '@/lib/ai-utils';
import { 
  handleApiError, 
  AuthenticationError, 
  ValidationError,
  InsufficientCreditsError,
  ExternalServiceError 
} from '@/lib/api-errors';
import { FEATURE_ID_MESSAGES } from '@/config/constants';
import { getOrCreateJobIdForWorkflow, normalizeUrlForJobKey } from '@/lib/db/job-utils';

const autumn = new Autumn({
  apiKey: process.env.AUTUMN_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to use this feature');
    }

    // Check if user has enough credits (1 credit for URL scraping)
    try {
      const access = await autumn.check({
        customer_id: sessionResponse.user.id,
        feature_id: FEATURE_ID_MESSAGES,
      });
      
      // Optional: enforce credit requirement here
      // if (!access.data?.allowed || (access.data?.balance && access.data.balance < 1)) {
      //   throw new InsufficientCreditsError(
      //     'Insufficient credits. You need at least 1 credit to analyze a URL.',
      //     { required: 1, available: access.data?.balance || 0 }
      //   );
      // }
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw error;
      }
      console.error('[Brand Monitor Scrape] Credit check error:', error);
      throw new ExternalServiceError('Unable to verify credits. Please try again', 'autumn');
    }

    const { url, maxAge, jobId: incomingJobId } = await request.json();

    if (!url) {
      throw new ValidationError('Invalid request', {
        url: 'URL is required'
      });
    }
    
    const normalizedUrl = normalizeUrlForJobKey(url);

    // Determine jobId (latest-per-url rule)
    const { jobId } = incomingJobId 
      ? { jobId: incomingJobId }
      : await getOrCreateJobIdForWorkflow(normalizedUrl, 'brand_analyses');

    // Track usage (1 credit for scraping)
    try {
      await autumn.track({
        customer_id: sessionResponse.user.id,
        feature_id: FEATURE_ID_MESSAGES,
        count: 0,
      });
    } catch (err) {
      console.error('[Brand Monitor Scrape] Error tracking usage:', err);
      // Continue even if tracking fails - we don't want to block the user
    }

    // 1) Scrape company info
    const company = await scrapeCompanyInfo(normalizedUrl, maxAge);
    (company as any).jobId = jobId;

    // 2) Determine competitors from scraped data (names array) if present
    const scrapedCompetitors: string[] = Array.isArray(company?.scrapedData?.competitors)
      ? company.scrapedData!.competitors!.filter(Boolean)
      : [];

    // 3) Generate prompts using scraped company data and competitors
    let prompts: any[] = [];
    try {
      prompts = await generatePromptsForCompany(company, scrapedCompetitors);
    } catch (e) {
      console.warn('[Brand Monitor Scrape] Failed to generate prompts from scrape; proceeding with empty prompts.', e);
      prompts = [];
    }

    // Return company and prompts together so UI can display prompts after Continue to Analysis
    return NextResponse.json({ company, prompts, jobId });
  } catch (error) {
    return handleApiError(error);
  }
}