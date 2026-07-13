import { ExtractedPage } from '../crawler/extractor.js';

export function buildBrochurePrompt(
  companyName: string,
  website: string,
  pages: ExtractedPage[]
): string {
  // Combine all crawled page text content into a single structured body
  const formattedContent = pages
    .map(
      (page) => `
========================================
SOURCE URL: ${page.url}
PAGE TITLE: ${page.title}
PAGE META DESCRIPTION: ${page.metaDescription}
========================================
CONTENT:
${page.rawText || '(Empty Page)'}
`
    )
    .join('\n');

  return `You are an elite Business Consultant and Marketing Strategist. Your task is to write a highly professional, comprehensive, and factual corporate brochure for the company "${companyName}" based strictly on the crawled web data provided below.

Here is the crawled data from the website (${website}):
--- START CRAWLED DATA ---
${formattedContent}
--- END CRAWLED DATA ---

Core Rules:
1. FACTUAL ACCURACY: Write the brochure using ONLY the facts and details provided in the crawled data. Never invent, assume, or hallucinate any information.
2. MISSING DATA: If information is not found in the crawled data for a requested section, write "[Information not found in website crawls]" for that section. Do not fabricate anything.
3. TONE: Write in a premium, enterprise-grade, authoritative, and engaging business tone.
4. FORMAT: You MUST output in clean, professional Markdown. Use headings, bullet points, subheadings, and tables where appropriate.

Your output must follow this structured outline. Ensure every section header is present:

# ${companyName} - Official Company Brochure

## Executive Summary
(Provide a high-level summary of the company, what they do, and their value proposition based on the crawls.)

## About the Company
(Describe the company's background, history, and what they do. Detail when they were founded or key milestones if available in the crawls.)

## Mission & Vision
(State their mission and vision statements. If not explicitly found, write "[Information not found in website crawls]".)

## Core Values
(Highlight their corporate values or driving principles.)

## Products & Services
(Detailed description of what they sell, build, or provide. Break down into subcategories if applicable.)

## Industries Served
(List or summarize the business sectors, industries, or target customer segments they serve.)

## Technology Stack
(Details of the technologies, tools, platforms, or hardware they use or develop, if mentioned in the crawls.)

## Competitive Advantages
(What makes this company unique? What are their key strengths or differentiators?)

## Company Culture & Careers
(Describe their workplace environment, values, open roles, or what they offer employees.)

## Why Choose This Company
(Provide a structured summary of the customer benefits and reasons to work with or buy from them.)

## Contact Information
(Extract and summarize addresses, contact phone numbers, email addresses, social media links, and other relevant contact details.)

## Conclusion
(A brief, inspiring concluding statement wrapping up the company's outlook.)

Begin generating the brochure now:`;
}
