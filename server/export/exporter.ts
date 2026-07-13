import { Paragraph, TextRun, HeadingLevel, Document, Packer, AlignmentType } from 'docx';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';
import { Brochure } from '../db/storage.js';

// Convert Markdown to clean HTML with a corporate CSS theme
export function exportToHtml(brochure: Brochure): string {
  const htmlContent = marked.parse(brochure.content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brochure.companyName} - Corporate Brochure</title>
  <style>
    :root {
      --primary: #4f46e5;
      --primary-dark: #3730a3;
      --text: #1f2937;
      --text-muted: #4b5563;
      --bg: #ffffff;
      --surface: #f9fafb;
      --border: #e5e7eb;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--text);
      line-height: 1.6;
      background-color: var(--bg);
      padding: 2rem 1.5rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: var(--bg);
    }

    /* Cover Header */
    .cover-header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 2rem;
      margin-bottom: 3rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cover-title h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      margin-bottom: 0.5rem;
    }

    .cover-title p {
      font-size: 1.1rem;
      color: var(--primary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .meta-box {
      font-size: 0.875rem;
      color: var(--text-muted);
      text-align: right;
    }

    .meta-box a {
      color: var(--primary);
      text-decoration: none;
    }

    /* Typography */
    h1, h2, h3, h4 {
      color: var(--text);
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }

    h2 {
      font-size: 1.5rem;
      color: var(--primary-dark);
      border-left: 4px solid var(--primary);
      padding-left: 0.75rem;
      margin-top: 2.5rem;
    }

    h3 {
      font-size: 1.2rem;
    }

    p {
      margin-bottom: 1.25rem;
      font-size: 1.05rem;
      color: #374151;
      text-align: justify;
    }

    ul, ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.5rem;
      font-size: 1.05rem;
      color: #374151;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.95rem;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 0.75rem 1rem;
      text-align: left;
    }

    th {
      background-color: var(--surface);
      font-weight: 600;
      color: var(--text);
    }

    tr:nth-child(even) {
      background-color: #fcfdfe;
    }

    /* Footer styling */
    footer {
      margin-top: 4rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Print styling optimization */
    @media print {
      body {
        padding: 0;
        background-color: transparent;
      }
      .container {
        max-width: 100%;
      }
      h2 {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="cover-header">
      <div class="cover-title">
        <h1>${brochure.companyName}</h1>
        <p>Company Brochure</p>
      </div>
      <div class="meta-box">
        <div>Website: <a href="${brochure.website}" target="_blank">${brochure.website.replace(/^https?:\/\/(www\.)?/, '')}</a></div>
        <div>Date: ${new Date(brochure.date).toLocaleDateString()}</div>
        <div>Model: ${brochure.model}</div>
      </div>
    </header>

    <main>
      ${htmlContent}
    </main>

    <footer>
      <p>&copy; ${new Date().getFullYear()} ${brochure.companyName}. Generated using Ollama &amp; Local LLM.</p>
    </footer>
  </div>
</body>
</html>`;
}

// Convert Markdown to PDF programmatically using PDFKit
export function exportToPdf(brochure: Brochure, writeStream: NodeJS.WritableStream): void {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true, // Needed for page numbering later
  });

  doc.pipe(writeStream);

  // Set colors
  const primaryColor = '#4f46e5';
  const textColor = '#1f2937';
  const mutedTextColor = '#4b5563';
  const lightBgColor = '#f9fafb';
  const dividerColor = '#e5e7eb';

  // --- 1. COVER PAGE ---
  doc.rect(0, 0, doc.page.width, 25).fill(primaryColor);
  
  doc.moveDown(5);
  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(36)
     .text(brochure.companyName.toUpperCase(), { align: 'center' });

  doc.moveDown(0.5);
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('PROFESSIONAL COMPANY BROCHURE', { align: 'center' });
  
  doc.moveDown(1.5);
  doc.strokeColor(dividerColor)
     .lineWidth(1)
     .moveTo(100, doc.y)
     .lineTo(doc.page.width - 100, doc.y)
     .stroke();

  doc.moveDown(2);
  doc.fillColor(mutedTextColor)
     .font('Helvetica')
     .fontSize(11)
     .text('A comprehensive strategic report outlining corporate operations, products, and services compiled from crawled website intelligence.', { align: 'center', width: doc.page.width - 200 });

  // Metadata Box at bottom
  doc.y = doc.page.height - 200;
  doc.rect(80, doc.y, doc.page.width - 160, 100).fill(lightBgColor);
  doc.strokeColor(dividerColor).rect(80, doc.y, doc.page.width - 160, 100).stroke();

  doc.y += 15;
  doc.fillColor(textColor)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('DOCUMENT METADATA', 100, doc.y);
  
  doc.moveDown(0.5);
  doc.font('Helvetica')
     .fillColor(mutedTextColor)
     .text(`Target Website:   ${brochure.website}`)
     .text(`Generation Date:  ${new Date(brochure.date).toLocaleString()}`)
     .text(`AI Model Used:    ${brochure.model}`)
     .text(`Processing time:   ${(brochure.durationMs / 1000).toFixed(1)} seconds`);

  doc.addPage();

  // --- 2. CONTENT PAGES ---
  // Split markdown into lines and parse simple block types
  const lines = brochure.content.split('\n');
  let inList = false;

  // Restore coordinates
  doc.fillColor(textColor).font('Helvetica').fontSize(10);

  // Read lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) {
        inList = false;
        doc.moveDown(0.5);
      }
      continue;
    }

    // Ignore top-level title H1 if it repeats the company name (since cover page covers it)
    if (line.startsWith('# ') && (line.includes(brochure.companyName) || line.includes('Brochure'))) {
      continue;
    }

    // Heading H2 (e.g. ## Executive Summary)
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      doc.moveDown(2);
      
      // Keep headings and first paragraph on same page if possible
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      // Draw active left indicator bar
      const headingY = doc.y;
      doc.rect(50, headingY, 4, 20).fill(primaryColor);

      doc.fillColor(textColor)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text(text, 65, headingY + 3);
      
      doc.x = 50; // reset indent
      doc.moveDown(1);
      continue;
    }

    // Heading H3 (e.g. ### Subheading)
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      doc.moveDown(1.2);
      if (doc.y > doc.page.height - 80) doc.addPage();
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(text);
      doc.moveDown(0.5);
      continue;
    }

    // Bullet List Item (e.g. * Item or - Item)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const text = line.substring(2).trim();
      inList = true;
      
      // Render clean bullet point
      doc.fillColor(textColor)
         .font('Helvetica')
         .fontSize(10)
         .text('\u2022', 60, doc.y, { continued: true })
         .text(`  ${text}`, 70, doc.y, { width: doc.page.width - 120 });
      doc.x = 50; // reset
      continue;
    }

    // Paragraph
    doc.fillColor(textColor)
       .font('Helvetica')
       .fontSize(10)
       .text(line, { align: 'justify', lineGap: 3 });
    doc.moveDown(0.8);
  }

  // --- 3. PAGE NUMBERS, RUNNING HEADER & FOOTER ---
  const range = doc.bufferedPageRange();
  for (let pageNum = range.start; pageNum < range.start + range.count; pageNum++) {
    doc.switchToPage(pageNum);

    if (pageNum === range.start) {
      // Don't draw headers/footers on cover page
      continue;
    }

    // Header
    doc.fillColor(mutedTextColor)
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('CORPORATE PROFILE & BROCHURE', 50, 25)
       .font('Helvetica')
       .text(brochure.companyName.toUpperCase(), doc.page.width - 50 - doc.widthOfString(brochure.companyName.toUpperCase()), 25);
    
    doc.strokeColor(dividerColor)
       .lineWidth(0.5)
       .moveTo(50, 36)
       .lineTo(doc.page.width - 50, 36)
       .stroke();

    // Footer
    doc.strokeColor(dividerColor)
       .lineWidth(0.5)
       .moveTo(50, doc.page.height - 40)
       .lineTo(doc.page.width - 50, doc.page.height - 40)
       .stroke();

    doc.fillColor(mutedTextColor)
       .font('Helvetica')
       .fontSize(8)
       .text('CONFIDENTIAL - FOR INTERNAL USE ONLY', 50, doc.page.height - 30)
       .text(`Page ${pageNum + 1} of ${range.count}`, doc.page.width - 50 - doc.widthOfString(`Page ${pageNum + 1} of ${range.count}`), doc.page.height - 30);
  }

  doc.end();
}

// Convert Markdown to a styled Microsoft Word Document using docx
export async function exportToDocx(brochure: Brochure): Promise<Buffer> {
  const children: any[] = [];

  // Title Page elements
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 200 },
      children: [
        new TextRun({
          text: brochure.companyName.toUpperCase(),
          bold: true,
          size: 72, // 36pt
          color: '1F2937',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1000 },
      children: [
        new TextRun({
          text: 'PROFESSIONAL COMPANY BROCHURE',
          bold: true,
          size: 28, // 14pt
          color: '4F46E5',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 3000 },
      children: [
        new TextRun({
          text: 'Compiled automatically using local LLM text intelligence from website crawls.',
          italics: true,
          size: 22, // 11pt
          color: '4B5563',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 1000 },
      children: [
        new TextRun({ text: 'DOCUMENT METADATA\n', bold: true, size: 20, color: '1F2937' }),
        new TextRun({ text: `Target Website: ${brochure.website}\n`, size: 20, color: '4B5563' }),
        new TextRun({ text: `Generation Date: ${new Date(brochure.date).toLocaleString()}\n`, size: 20, color: '4B5563' }),
        new TextRun({ text: `AI Model Used: ${brochure.model}\n`, size: 20, color: '4B5563' }),
      ],
    })
  );

  // Markdown parsing to docx structure
  const lines = brochure.content.split('\n');
  
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Ignore the main brochure title to avoid repeating the title page
    if (line.startsWith('# ') && (line.includes(brochure.companyName) || line.includes('Brochure'))) {
      continue;
    }

    if (line.startsWith('## ')) {
      // H2 Heading
      const text = line.substring(3).trim();
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 120 },
          keepNext: true,
        })
      );
    } else if (line.startsWith('### ')) {
      // H3 Subheading
      const text = line.substring(4).trim();
      children.push(
        new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 80 },
          keepNext: true,
        })
      );
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      // Bullet Item
      const text = line.substring(2).trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: text,
              size: 21, // 10.5pt
              color: '1F2937',
              font: 'Calibri',
            }),
          ],
        })
      );
    } else {
      // Regular Paragraph
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: line,
              size: 21, // 10.5pt
              color: '1F2937',
              font: 'Calibri',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch margins
          },
        },
        children: children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
