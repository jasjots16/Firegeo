// prompts/competitor-identification.ts

export interface CompetitorIdentificationParams {
    companyName: string;
    industry: string;
    description: string;
    keywords?: string;
    knownCompetitors?: string;
}

export const COMPETITOR_IDENTIFICATION_PROMPT = (params: CompetitorIdentificationParams) => `
Identify 6-9 real, established competitors of ${params.companyName} in the ${params.industry} industry.

Company: ${params.companyName}
Industry: ${params.industry}
Description: ${params.description}
${params.keywords ? `Keywords: ${params.keywords}` : ''}
${params.knownCompetitors ? `Known competitors: ${params.knownCompetitors}` : ''}

Based on this company's specific business model and target market, identify ONLY direct competitors that:
1. Offer the SAME type of products/services (not just retailers that sell them)
2. Target the SAME customer segment
3. Have a SIMILAR business model (e.g., if it's a DTC brand, find other DTC brands)
4. Actually compete for the same customers
5. Identify location of the company ${params.companyName} and get one or two competitors from same city or region

For example:
- If it's a DTC underwear brand, find OTHER DTC underwear brands (not department stores)
- If it's a web scraping API, find OTHER web scraping APIs (not general data tools)
- If it's an AI model provider, find OTHER AI model providers (not AI applications)

IMPORTANT:
- Only include companies you are confident actually exist
- Focus on TRUE competitors with similar offerings
- Exclude retailers, marketplaces, or aggregators unless the company itself is one
- Aim for 6-9 competitors total
- Do NOT include general retailers or platforms that just sell/distribute products
`;

export const AI_COMPETITOR_DETECTION_PROMPT = (params: { companyName: string; companyContext: string }) => `
Based on the following company information, identify 6-8 direct competitors in the same industry/market segment.

${params.companyContext}

Requirements:
- Focus on DIRECT competitors offering similar products/services to the same target market
- Include well-known industry leaders and emerging players
- Provide the most common/official domain for each competitor (e.g., "shopify.com", not full URLs)
- Be specific and relevant to this exact business, not generic industry players

Return ONLY a JSON array in this exact format with no additional text:
[
  {"name": "Competitor Name", "url": "domain.com"},
  {"name": "Another Competitor", "url": "example.com"}
]
`;
