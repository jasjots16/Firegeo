"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PromptItem {
  prompt: string;
  responses: Array<{
    provider: string; // model/provider name
    brandMentioned: boolean;
    sentiment: 'positive' | 'neutral' | 'negative';
    snippet: string;
  }>;
}

interface PromptsResponsesPanelProps {
  items?: PromptItem[]; // optional for future dynamic data
}

export function PromptsResponsesPanel({ items }: PromptsResponsesPanelProps) {
  // Temporary hardcoded demo data as requested
  const demo: PromptItem[] = items || [
    {
      prompt: "Top wireless earbuds for workouts in 2025",
      responses: [
        {
          provider: 'OpenAI - gpt-4o-mini',
          brandMentioned: true,
          sentiment: 'positive',
          snippet: "boAt offers durable workout-focused earbuds with strong bass and water resistance...",
        },
        {
          provider: 'Anthropic - Claude 3 Haiku',
          brandMentioned: true,
          sentiment: 'neutral',
          snippet: "boAt is commonly cited among budget-friendly options; however, premium models may offer...",
        },
        {
          provider: 'Google - Gemini 1.5 Flash',
          brandMentioned: false,
          sentiment: 'neutral',
          snippet: "Popular options include models from Sony, Apple and Samsung with ANC and multi-point...",
        },
      ],
    },
    {
      prompt: "Best affordable smartwatches in India",
      responses: [
        {
          provider: 'OpenAI - gpt-4o-mini',
          brandMentioned: true,
          sentiment: 'positive',
          snippet: "boAt smartwatches offer competitive pricing with reliable health tracking and long battery...",
        },
        {
          provider: 'Google - Gemini 1.5 Flash',
          brandMentioned: true,
          sentiment: 'neutral',
          snippet: "boAt is frequently compared with Noise and Fire-Boltt in the budget smartwatch segment...",
        },
      ],
    },
  ];

  const sentimentColor = (s: 'positive' | 'neutral' | 'negative') =>
    s === 'positive' ? 'bg-green-50 text-green-700 border border-green-200'
    : s === 'negative' ? 'bg-red-50 text-red-700 border border-red-200'
    : 'bg-gray-50 text-gray-700 border border-gray-200';

  return (
    <Card className="p-2 bg-card text-card-foreground gap-6 rounded-xl border py-6 shadow-sm border-gray-200">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Prompts & Responses</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Latest prompts and provider responses (demo)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {demo.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-gray-900">{item.prompt}</p>
            </div>

            <div className="mt-3 space-y-2">
              {item.responses.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 rounded border bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600">{r.provider}</p>
                    <p className="text-sm text-gray-900 mt-0.5 line-clamp-2">{r.snippet}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.brandMentioned ? (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">Mentioned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-700 bg-gray-50">Not Mentioned</Badge>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sentimentColor(r.sentiment)}`}>
                      {r.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
