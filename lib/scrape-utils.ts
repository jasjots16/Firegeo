import { generateObject } from 'ai';
import { z } from 'zod';
import { Company } from './types';
import FirecrawlApp from '@mendable/firecrawl-js';
import { getConfiguredProviders, getProviderModel } from './provider-config';
import { AIProviderError, logDetailedError, isQuotaError } from './error-utils';
import { debugProviders } from './debug-providers';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const CompanyInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  industry: z.string(),
  mainProducts: z.array(z.string()),
  competitors: z.array(z.string()).optional(),
});

export async function scrapeCompanyInfo(url: string, maxAge?: number): Promise<Company> {
  try {
    // Ensure URL has protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Default to 1 week cache if not specified
    const cacheAge = maxAge ? Math.floor(maxAge / 1000) : 604800; // 1 week in seconds
    
    console.log(`[DEBUG] Starting scrape for URL: ${normalizedUrl}`);
    const response = await firecrawl.scrapeUrl(normalizedUrl, {
      formats: ['markdown'],
      maxAge: cacheAge,
    });
    console.log(`[DEBUG] Firecrawl response: ${JSON.stringify(response)}`);
    if (!response.success) {
      throw new Error(response.error);
    }
    const html = response.markdown;
    const metadata = response.metadata;
    console.log('[DEBUG] Firecrawl scrape successful. Markdown length:', html ? html.length : 0);
    

    // Use AI to extract structured information - try providers with fallback
    console.log('[DEBUG] Checking provider configuration...');
    const providerDebug = debugProviders();
    
    const configuredProviders = getConfiguredProviders();
    console.log(`[DEBUG] Found ${configuredProviders.length} configured providers:`, configuredProviders.map(p => p.name));
    
    if (configuredProviders.length === 0) {
      console.error('[DEBUG] No providers available. Debug info:', providerDebug);
      throw new Error('No AI providers configured and enabled for content extraction');
    }
    
    let extractedData;
    let lastError;
    
    // Try each configured provider until one succeeds (in priority order)
    for (let i = 0; i < configuredProviders.length; i++) {
      const provider = configuredProviders[i];
      try {
        const model = getProviderModel(provider.id, provider.models.find(m => m.name.toLowerCase().includes('mini') || m.name.toLowerCase().includes('flash'))?.id || provider.defaultModel);
        if (!model) {
          console.warn(`[DEBUG] ${provider.name} model not available, trying next provider`);
          continue;
        }
        
        console.log(`[DEBUG] Attempting AI extraction with ${provider.name} (attempt ${i + 1}/${configuredProviders.length})`);

        const { object } = await generateObject({
          model,
          schema: CompanyInfoSchema,
          prompt: `Extract company information from this website content:
          
          URL: ${normalizedUrl}
          Content: ${html}
          
          Extract the company name, a brief description, relevant keywords, and identify the PRIMARY industry category. 
          
          Industry detection rules:
          - If the company makes coolers, drinkware, outdoor equipment, camping gear, categorize as "outdoor gear"
          - If the company offers web scraping, crawling, data extraction, or HTML parsing tools/services, categorize as "web scraping"
          - If the company primarily provides AI/ML models or services, categorize as "AI"
          - If the company offers hosting, deployment, or cloud infrastructure, categorize as "deployment"
          - If the company is an e-commerce platform or online store builder, categorize as "e-commerce platform"
          - If the company sells physical products directly to consumers (clothing, accessories, etc.), categorize as "direct-to-consumer brand"
          - If the company is in fashion/apparel/underwear/clothing, categorize as "apparel & fashion"
          - If the company provides software tools or APIs, categorize as "developer tools"
          - If the company is a marketplace or aggregator, categorize as "marketplace"
          - For other B2B software, use "SaaS"
          - For other consumer products, use "consumer goods"
          
          IMPORTANT: 
          1. For mainProducts, list the ACTUAL PRODUCTS (e.g., "coolers", "tumblers", "drinkware") not product categories
          2. For competitors, extract FULL COMPANY NAMES (e.g., "RTIC", "IGLOO", "Coleman") not just initials
          3. Focus on what the company MAKES/SELLS, not what goes IN their products (e.g., Yeti makes coolers, not beverages)`,
        });
        
        extractedData = object;
        console.log(`[DEBUG] AI extraction successful with ${provider.name}`);
        break;
      } catch (error) {
        const aiError = new AIProviderError(provider.name, error as Error, {
          url: normalizedUrl,
          modelId: provider.defaultModel,
        });
        lastError = aiError;
        
        logDetailedError(aiError, {
          provider: provider.name,
          url: normalizedUrl,
          attempt: i + 1,
          totalProviders: configuredProviders.length,
        });
        
        // Check if it's a quota/billing error
        if (isQuotaError(error as Error)) {
          console.log(`[DEBUG] ${provider.name} quota exceeded, trying next provider`);
          continue;
        }
        
        // For other errors, also try the next provider
        continue;
      }
    }
    
    if (!extractedData) {
      console.error('[DEBUG] All AI providers failed, throwing last error');
      throw lastError || new Error('All AI providers failed to extract company information');
    }

    console.log('[DEBUG] AI extraction successful.');

    // Extract favicon URL - try multiple sources
    const urlObj = new URL(normalizedUrl);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Try to get a high-quality favicon from various sources
    const faviconUrl = metadata?.favicon || 
                      `https://www.google.com/s2/favicons?domain=${domain}&sz=128` ||
                      `${urlObj.origin}/favicon.ico`;
    
    return {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      name: extractedData.name,
      description: extractedData.description,
      industry: extractedData.industry,
      logo: metadata?.ogImage || undefined,
      favicon: faviconUrl,
      scraped: true,
      scrapedData: {
        title: extractedData.name,
        description: extractedData.description,
        keywords: extractedData.keywords,
        mainContent: html || '',
        mainProducts: extractedData.mainProducts,
        competitors: extractedData.competitors,
        ogImage: metadata?.ogImage || undefined,
        favicon: faviconUrl,
      },
    };
  } catch (error) {
    console.error('Error scraping company info:', error);
    
    // Ensure URL has protocol for fallback
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Fallback: extract company name from URL
    const urlObj = new URL(normalizedUrl);
    const domain = urlObj.hostname.replace('www.', '');
    const companyName = domain.split('.')[0];
    const formattedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    return {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      name: formattedName,
      description: `Information about ${formattedName}`,
      industry: 'technology',
      scraped: false,
    };
  }
}