import { NextRequest, NextResponse } from 'next/server';
import { buildAuditBundle } from '../../../lib/aeo/auditBundle';
import { renderAeoJsonToHtml, AeoModelOutput } from '../../../lib/aeo/aeoReportFromPrompt';
import { renderSchemaAuditToHtml, SchemaAuditOutput } from '../../../lib/aeo/schemaReportFromPrompt';
import { buildBasicSectionFromAudit } from '../../../lib/aeo/basicFromAudit';
import { callLLMJSON } from '../../../lib/providers/llm';
import { SCHEMA_AUDIT_PROMPT } from '../../../lib/aeo/prompts/schemaAuditPrompt';
import { db } from '../../../lib/db';
import { aeoReports, notifications } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../../../lib/auth';

interface AEOReportRequest {
  url: string;
  customerName?: string;
  maxPages?: number;
}

function deriveCustomerNameFromUrl(u: string): string {
  try {
    const { hostname } = new URL(u);
    const base = hostname.replace(/^www\./, '');
    const name = base.split('.')[0] || 'client';
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Client';
  }
}

const AUDITOR_PROMPT_PREFIX = `You are an expert AEO (Answer Engine Optimization) auditor assistant. I will provide the extracted content of one or more webpages, including:
- Headings, paragraphs, lists
- Images with alt text or captions
- Structured data (JSON-LD, Microdata, RDFa)
- Optional: metadata like title, meta description
Your task is to produce a **comprehensive, human-readable, structured JSON report per page** that is easy for a non-technical person to understand.
FOR EACH PAGE, OUTPUT:
{
  "url": "...",
  "structuredContent": [
    {
      "type": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "textOrSummary": "...",
      "status": "valid|missing|incorrect",
      "issues": ["..."],
      "recommendedChanges": "..."
    }
  ],
  "unstructuredContent": [
    {
      "contentType": "paragraph|heading|list|image",
      "textOrAlt": "...",
      "suggestedAeoType": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "reasonItIsImportant": "...",
      "recommendation": "markup it with JSON-LD / optimize for AEO/GEO"
    }
  ],
  "optimizationSuggestions": [
    {
      "existingContent": "...",
      "problem": "too generic / missing schema / poor snippet / missing alt text",
      "suggestedFix": "..."
    }
  ],
  "newContentRecommendations": [
    {
      "contentType": "paragraph|heading|list|image",
      "suggestedTopicOrText": "...",
      "aeoType": "FAQPage|HowTo|Article|Product|Service|Review|Person|Organization|Breadcrumb",
      "reasonForAdding": "..."
    }
  ],
  "summaryScore": {
      "structuredCoverage": 0-100,
      "unstructuredCoverage": 0-100,
      "optimizationOpportunities": 0-100,
      "overallAEOReadiness": 0-100
  }
}
RULES:
1. Do NOT invent facts. Use placeholders like COMPANY_NAME, SERVICE_NAME if information is missing.
2. Identify **all content relevant for AEO**, whether structured or unstructured.
3. Clearly separate **already structured content**, **unstructured but AEO-relevant content**, **content that needs optimization**, and **suggested new content**.
4. Provide concise explanations for each recommendation so a **non-technical person** can understand.
5. Include JSON-LD validation hints for each structured block (e.g., "validate with Google Rich Results Test").
6. Keep output **strictly valid JSON**, no extra text, commentary, or formatting outside the JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body: AEOReportRequest = await request.json();
    const { url, maxPages = 5 } = body;
    let { customerName } = body;
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    // Normalize customerName for consistency
    if (!customerName || !customerName.trim()) customerName = deriveCustomerNameFromUrl(url);
    customerName = customerName.trim();
    // Title-case basic normalization (keep original if already formatted)
    customerName = customerName
      .split(/\s+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // Get session via Better Auth
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: request.headers as any });
      if (session?.user) {
        userId = session.user.id || null;
        userEmail = session.user.email || null;
      }
    } catch {
      // no session, continue
    }

    // Insert into DB with empty HTML
    let insertedReport;
    try {
      insertedReport = await db.insert(aeoReports).values({
        userId: userId || null,
        userEmail: userEmail || null,
        customerName,
        url,
        html: "", // HTML column is empty
        read: false, // Default to unread
      }).returning({ id: aeoReports.id }); // Get the ID of the newly inserted record
    } catch (e) {
      console.error('Failed to insert aeo_report:', e);
      return NextResponse.json({ error: 'Failed to initiate AEO report generation' }, { status: 500 });
    }

    const reportId = insertedReport[0]?.id;

    if (!reportId) {
      return NextResponse.json({ error: 'Failed to get report ID after insertion' }, { status: 500 });
    }

    // Send data to webhook
    try {
      await fetch("https://n8n.welz.in/webhook/2f48da23-976e-4fd0-97da-2cb24c0b3e39", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          url,
          userEmail: userEmail || null,
          brand: customerName,
        }),
      });
    } catch (e) {
      console.error('Failed to send webhook for aeo_report:', e);
      // Optionally, handle webhook failure more robustly, e.g., mark report as failed
    }

    // Insert notification entry
    try {
      await db.insert(notifications).values({
        userId: userId || null,
        userEmail: userEmail || null,
        type: 'aeo_report_generated',
        message: `Your AEO report for ${customerName} is being generated. We will notify you when it's ready.`,
        link: `/brand-monitor?tab=aeo&id=${reportId}`,
        status: 'not_sent',
        read: false,
      });
    } catch (e) {
      console.error('Failed to insert notification for aeo_report:', e);
    }

    return NextResponse.json({
      success: true,
      message: "AEO report generation initiated. We will notify you when the report is ready.",
      reportId: reportId,
    });
  } catch (error) {
    console.error('AEO Report generation error (combined flows):', error);
    return NextResponse.json({ error: 'Failed to generate AEO report', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// Keep GET for basic quick summary
import { buildBasicReport } from '../../../lib/aeo/basicReport';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    const customerName = deriveCustomerNameFromUrl(url);
    const htmlContent = await buildBasicReport(url);
    return NextResponse.json({ success: true, htmlContent, customerName, reportType: 'basic' });
  } catch (error) {
    console.error('AEO Report retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve AEO report', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

function escapeHtml(s: string) { return String(s||'').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c] || c); }

function extractFirstJsonValue(raw: string): string {
  let s = String(raw ?? '').trim();

  // Strip BOM
  if (s.length && s.charCodeAt(0) === 0xFEFF) s = s.slice(1);

  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  if (s.startsWith('```')) {
    const firstLineEnd = s.indexOf('\n');
    if (firstLineEnd !== -1) {
      const fenceLang = s.slice(3, firstLineEnd).trim().toLowerCase();
      if (fenceLang === '' || fenceLang === 'json') {
        s = s.slice(firstLineEnd + 1);
        const closing = s.lastIndexOf('```');
        if (closing !== -1) {
          s = s.slice(0, closing);
        }
      }
    }
    s = s.trim();
  }

  // Find first non-whitespace
  let i = 0;
  while (i < s.length && /\s/.test(s[i])) i++;
  if (i >= s.length) return s;

  // Ensure we start at '{' or '['
  let startIdx = i;
  if (s[startIdx] !== '{' && s[startIdx] !== '[') {
    const jObj = s.indexOf('{', startIdx);
    const jArr = s.indexOf('[', startIdx);
    const j = (jObj === -1) ? jArr : (jArr === -1 ? jObj : Math.min(jObj, jArr));
    if (j === -1) return s.trim();
    startIdx = j;
  }

  const openChar = s[startIdx];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let k = startIdx; k < s.length; k++) {
    const ch = s[k];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === openChar) depth++;
    else if (ch === closeChar) depth--;

    if (depth === 0) {
      return s.slice(startIdx, k + 1).trim();
    }
  }

  // Unclosed JSON, return what we have (will still throw on parse)
  return s.slice(startIdx).trim();
}
