import React from 'react';

function parseColumns(line: string): string[] {
  // If the line has pipes, let's use pipe splitting
  if (line.includes('|')) {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map(col => col.trim());
  }
  // Otherwise, split by tabs or double spaces
  return line.split(/\t| {2,}/).map(col => col.trim()).filter(Boolean);
}

interface SmartTextRendererProps {
  text: string;
  fontSize?: 'small' | 'normal' | 'medium' | 'large';
  themeColor?: 'emerald' | 'blue' | 'teal' | 'crimson' | 'slate';
}

export function SmartTextRenderer({ text, fontSize = 'normal', themeColor = 'emerald' }: SmartTextRendererProps) {
  if (!text) return null;

  // Compute dynamic colors based on chosen themeColor
  let colonColorClass = 'text-emerald-900';
  let quoteBorderColorClass = 'border-emerald-600';
  let headingColorClass = 'text-emerald-800 border-slate-200';

  if (themeColor === 'blue') {
    colonColorClass = 'text-blue-900';
    quoteBorderColorClass = 'border-blue-600';
    headingColorClass = 'text-blue-800 border-slate-200';
  } else if (themeColor === 'teal') {
    colonColorClass = 'text-teal-900';
    quoteBorderColorClass = 'border-teal-600';
    headingColorClass = 'text-teal-800 border-slate-200';
  } else if (themeColor === 'crimson') {
    colonColorClass = 'text-rose-900';
    quoteBorderColorClass = 'border-rose-600';
    headingColorClass = 'text-rose-800 border-slate-200';
  } else if (themeColor === 'slate') {
    colonColorClass = 'text-slate-900';
    quoteBorderColorClass = 'border-slate-500';
    headingColorClass = 'text-slate-800 border-slate-300';
  }

  // Compute dynamic font sizes based on chosen option
  const textClass = 
    fontSize === 'small' ? 'text-[10px]' :
    fontSize === 'medium' ? 'text-[13px]' :
    fontSize === 'large' ? 'text-[15px]' :
    'text-[11.5px]';

  // If text contains HTML tags, render directly as formatted HTML inside the document flow
  if (/<[a-z][\s\S]*>/i.test(text.trim())) {
    const cleanedHtml = text
      .replace(/<\/?(?:html|body|head)[^>]*>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<table[^>]*>[\s\S]*?Document Control Information Log[\s\S]*?<\/table>/gi, '')
      .replace(/Document Control Information Log[\s\S]*?Next Due Revision Date[^\n]*/gi, '')
      .trim();
    return (
      <div 
        className={`prose max-w-none font-sans text-slate-800 leading-relaxed ${textClass} [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:border [&_table]:border-slate-300 [&_th]:bg-slate-900 [&_th]:text-white [&_th]:border [&_th]:border-slate-800 [&_th]:p-2 [&_th]:font-bold [&_th]:text-[10px] [&_th]:uppercase [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_td]:align-top [&_p]:my-2 [&_h1]:text-base [&_h1]:font-black [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-disc [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5`}
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    );
  }

  const headingClass = 
    fontSize === 'small' ? 'text-[11px]' :
    fontSize === 'medium' ? 'text-[14px]' :
    fontSize === 'large' ? 'text-[16px]' :
    'text-[12px]';

  const tableClass = 
    fontSize === 'small' ? 'text-[9.5px]' :
    fontSize === 'medium' ? 'text-[12px]' :
    fontSize === 'large' ? 'text-[13.5px]' :
    'text-[10.5px]';

  const tableHeaderClass = 
    fontSize === 'small' ? 'text-[8.5px]' :
    fontSize === 'medium' ? 'text-[11px]' :
    fontSize === 'large' ? 'text-[12.5px]' :
    'text-[9.5px]';

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentParagraphLines: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushParagraph = (key: number) => {
    if (currentParagraphLines.length === 0) return;
    const blockText = currentParagraphLines.join('\n').trim();
    if (blockText) {
      if (blockText.startsWith('•') || blockText.startsWith('-') || blockText.startsWith('*')) {
        // Bullet list
        const items = blockText
          .split('\n')
          .map(item => item.replace(/^[•\-*]\s*/, '').trim())
          .filter(Boolean);
        elements.push(
          <ul key={`list-${key}`} className={`list-disc pl-5 my-2.5 space-y-1 ${textClass} text-slate-700 font-sans`}>
            {items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInLineFormatting(it)}
              </li>
            ))}
          </ul>
        );
      } else if (/^[0-9]+\.\s+/.test(blockText)) {
        // Numbered list
        const items = blockText
          .split('\n')
          .map(item => item.replace(/^[0-9]+\.\s*/, '').trim())
          .filter(Boolean);
        elements.push(
          <ol key={`ol-${key}`} className={`list-decimal pl-5 my-2.5 space-y-1 ${textClass} text-slate-700 font-sans`}>
            {items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInLineFormatting(it)}
              </li>
            ))}
          </ol>
        );
      } else {
        // Simple paragraph
        elements.push(
          <p key={`p-${key}`} className={`${textClass} text-slate-700 leading-relaxed font-sans mb-3 whitespace-pre-wrap`}>
            {renderInLineFormatting(blockText)}
          </p>
        );
      }
    }
    currentParagraphLines = [];
  };

  const renderInLineFormatting = (str: string) => {
    // Bold italic highlights: e.g. **bold** or *italic*
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-800 font-medium">{part.slice(1, -1)}</em>;
      }
      // Highlight colon subtitles like "Administrative controls :" or "Technical controls:"
      const colonIndex = part.indexOf(':');
      if (colonIndex > 0 && colonIndex < 35 && !part.startsWith('http') && /^[A-Za-z0-9\s-\(\)\/]+$/.test(part.substring(0, colonIndex))) {
        const title = part.substring(0, colonIndex);
        const rest = part.substring(colonIndex);
        return (
          <span key={i}>
            <strong className={`${colonColorClass} font-bold`}>{title}</strong>
            {rest}
          </span>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for Blockquote (Highlighted Callout Box)
    if (line.startsWith('>')) {
      flushParagraph(i);
      
      // Collect all contiguous blockquote lines
      let quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        let qLine = lines[i].trim();
        // Remove the leading '>' and up to one whitespace
        qLine = qLine.substring(1);
        if (qLine.startsWith(' ')) qLine = qLine.substring(1);
        quoteLines.push(qLine);
        i++;
      }
      i--; // Adjust index back
      
      const quoteContent = quoteLines.join('\n');
      elements.push(
        <div key={`quote-${i}`} className={`my-3 border-l-4 ${quoteBorderColorClass} bg-slate-50 border-r border-t border-b border-slate-200/80 p-4 rounded-r-lg shadow-2xs`}>
          <div className={`${textClass} text-slate-800 font-sans leading-relaxed whitespace-pre-wrap`}>
            {renderInLineFormatting(quoteContent)}
          </div>
        </div>
      );
      continue;
    }

    // Check for Markdown headers
    if (line.startsWith('###') || line.startsWith('####') || line.startsWith('##')) {
      flushParagraph(i);
      const title = line.replace(/^#+\s*/, '').trim();
      elements.push(
        <h5 key={`h-${i}`} className={`${headingClass} font-extrabold ${headingColorClass} uppercase tracking-wider pb-1 mt-4 mb-2`}>
          {title}
        </h5>
      );
      continue;
    }

    // Split line by separators to check if it's a table row
    const rawCols = parseColumns(line);

    // Criteria to detect header row:
    // - Columns length between 2 and 6
    // - Specific typical regulatory/risk header names
    const isHeader = rawCols.length >= 2 && rawCols.length <= 6 && (
      rawCols.some(c => {
        const cl = c.toLowerCase();
        return cl === 'rating' || cl === 'score' || cl === 'risk score' || cl === 'risk level' || cl === 'level' || cl === 'description' || cl === 'measurable impact definition' || cl === 'confidentiality' || cl === 'integrity' || cl === 'availability' || cl === 'response & acceptance criteria' || cl === 'clause' || cl === 'id' || cl === 'directive' || cl === 'controls' || cl === 'option' || cl === 'criteria' || cl === 'requirement' || cl === 'classification' || cl === 'classification level' || cl === 'applicability' || cl === 'control area' || cl === 'control objective' || cl === 'public' || cl === 'restricted' || cl === 'confidential' || cl === 'secret' || cl === 'change type' || cl === 'definition & criteria' || cl === 'requirements' || cl === 'supporting documentation';
      })
    );

    if (isHeader && !inTable) {
      flushParagraph(i);
      inTable = true;
      tableHeaders = rawCols;
      tableRows = [];

      // Check if next line is a markdown separator (e.g., |---|---|)
      if (i + 1 < lines.length && /^[|\s:\-]{3,}$/.test(lines[i + 1].trim())) {
        i++;
      }
      continue;
    }

    if (inTable) {
      // Parse row columns
      const rowCols = parseColumns(line);

      // Verify if row is still part of the table. If it's empty, or looks like a standard sentence, close table
      const isTableRow = rowCols.length > 0 && (
        rowCols.length >= tableHeaders.length - 1 || 
        /^[0-9]/.test(rowCols[0]) || 
        rowCols[0].includes('–') ||
        rowCols[0].includes('-')
      );

      if (isTableRow) {
        tableRows.push(rowCols);
      } else {
        // Table ended. Flush table!
        if (tableRows.length > 0) {
          elements.push(renderTableElement(i, tableHeaders, tableRows, tableClass, tableHeaderClass, renderInLineFormatting));
        }
        inTable = false;
        tableHeaders = [];
        tableRows = [];

        // Add line to normal flow
        if (line) {
          currentParagraphLines.push(lines[i]);
        }
      }
      continue;
    }

    if (line === '') {
      flushParagraph(i);
    } else {
      currentParagraphLines.push(lines[i]);
    }
  }

  // Flush remaining content
  flushParagraph(lines.length);
  if (inTable && tableRows.length > 0) {
    elements.push(renderTableElement(lines.length, tableHeaders, tableRows, tableClass, tableHeaderClass, renderInLineFormatting));
  }

  return <div className="space-y-3">{elements}</div>;
}

function renderCellContent(val: string, renderInLineFormatting: (str: string) => React.ReactNode) {
  if (!val) return '';
  // Split by <br/>, <br>, or newlines
  const lines = val.split(/<br\s*\/?>|\n/i);
  return (
    <div className="space-y-1 text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '').trim();
          return (
            <div key={idx} className="flex items-start gap-1 text-[10px] leading-tight text-slate-700">
              <span className="text-slate-400 mt-0.5 select-none">•</span>
              <span className="flex-1">{renderInLineFormatting(content)}</span>
            </div>
          );
        }
        return (
          <div key={idx} className="text-[10.5px] leading-relaxed text-slate-700">
            {renderInLineFormatting(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

function renderTableElement(
  key: number, 
  headers: string[], 
  rows: string[][], 
  tableClass: string, 
  tableHeaderClass: string,
  renderInLineFormatting: (str: string) => React.ReactNode
) {
  const isRiskTable = headers.some(h => {
    const hl = h.toLowerCase();
    return hl.includes('risk') || hl.includes('score') || hl.includes('level') || hl.includes('impact');
  });

  const isClassificationTable = headers.some(h => {
    const hl = h.toLowerCase();
    return hl.includes('classification');
  });

  const isApplicabilityTable = headers.some(h => {
    const hl = h.toLowerCase();
    return hl.includes('applicability');
  });

  const isZoningMatrixTable = headers.length === 3 &&
    headers.some(h => h.toLowerCase().includes('risk area')) &&
    headers.some(h => h.toLowerCase().includes('risk location')) &&
    headers.some(h => h.toLowerCase().includes('custodian'));

  const isClassificationHandlingTable = headers.length === 4 &&
    headers.some(h => h.toLowerCase() === 'public') &&
    headers.some(h => h.toLowerCase() === 'restricted') &&
    headers.some(h => h.toLowerCase() === 'confidential') &&
    headers.some(h => h.toLowerCase() === 'secret');

  if (isZoningMatrixTable) {
    return (
      <div key={`zoning-matrix-${key}`} className="my-6 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs font-sans max-w-2xl mx-auto text-left">
        {/* Title */}
        <div className="py-2 bg-slate-50 border-b border-slate-200 text-center font-bold text-slate-700 tracking-wide text-[11px] uppercase">
          Interactive Zoning Matrix Preview:
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[9px] uppercase tracking-wider">
                <th className="py-2 px-3 w-1/3 border-r border-slate-200">Risk Area</th>
                <th className="py-2 px-3 w-1/3 border-r border-slate-200">Risk Location</th>
                <th className="py-2 px-3">Custodian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row, idx) => {
                const area = row[0] || '';
                const location = row[1] || '';
                const custodian = row[2] || '';
                
                // If it is the trailing note row
                if (area.startsWith('*') && !location && !custodian) {
                  return (
                    <tr key={idx} className="bg-slate-50 text-[9px] text-slate-500 italic">
                      <td colSpan={3} className="py-1.5 px-3 font-medium">
                        {area}
                      </td>
                    </tr>
                  );
                }
                
                let bgStyle = "bg-white";
                if (area.toLowerCase().includes('public')) {
                  bgStyle = "bg-emerald-50/30 text-emerald-900";
                } else if (area.toLowerCase().includes('restricted') || area.toLowerCase().includes('work')) {
                  bgStyle = "bg-amber-50/30 text-amber-900";
                } else if (area.toLowerCase().includes('high')) {
                  bgStyle = "bg-rose-50/30 text-rose-900";
                }
                
                return (
                  <tr key={idx}>
                    <td className={`py-2 px-3 font-semibold border-r border-slate-200 ${bgStyle}`}>{area}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-800 leading-relaxed">
                      {location}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-medium leading-relaxed">{custodian}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isClassificationHandlingTable) {
    return (
      <div key={`class-handling-${key}`} className="my-6 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs font-sans max-w-2xl mx-auto">
        {/* Title */}
        <div className="py-2 bg-slate-50 border-b border-slate-200 text-center font-bold text-slate-700 tracking-wide text-[11px] uppercase">
          Information Assets Handling Procedures
        </div>
        
        {/* Responsive Table / Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '500px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] tracking-wider uppercase text-center divide-x divide-slate-200">
                <th className="py-2 px-2 w-1/4">Public</th>
                <th className="py-2 px-2 w-1/4">Restricted</th>
                <th className="py-2 px-2 w-1/4">Confidential</th>
                <th className="py-2 px-2 w-1/4">Secret</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-slate-200">
                {/* Public */}
                <td className="p-2 bg-white align-top w-1/4">
                  <div className="rounded-md p-2 text-white flex flex-col justify-between h-22 shadow-xs font-mono text-[9px] leading-snug transition-all duration-300 hover:scale-[1.02] hover:shadow-sm" style={{ backgroundColor: '#009640' }}>
                    <div className="space-y-0.5">
                      <div className="font-semibold opacity-90">C100 M0 Y100 K0</div>
                      <div className="font-semibold opacity-90">R0 G150 B64</div>
                      <div className="font-mono bg-black/15 px-1 py-0.5 rounded w-max">#009640</div>
                    </div>
                    <div className="text-right font-black tracking-wider uppercase text-[9px] drop-shadow-xs">GREEN</div>
                  </div>
                </td>

                {/* Restricted */}
                <td className="p-2 bg-white align-top w-1/4">
                  <div className="rounded-md p-2 text-white flex flex-col justify-between h-22 shadow-xs font-mono text-[9px] leading-snug transition-all duration-300 hover:scale-[1.02] hover:shadow-sm" style={{ backgroundColor: '#009EE3' }}>
                    <div className="space-y-0.5">
                      <div className="font-semibold opacity-90">C100 M0 Y0 K0</div>
                      <div className="font-semibold opacity-90">R0 G158 B227</div>
                      <div className="font-mono bg-black/15 px-1 py-0.5 rounded w-max">#009EE3</div>
                    </div>
                    <div className="text-right font-black tracking-wider uppercase text-[9px] drop-shadow-xs">BLUE</div>
                  </div>
                </td>

                {/* Confidential */}
                <td className="p-2 bg-white align-top w-1/4">
                  <div className="rounded-md p-2 text-white flex flex-col justify-between h-22 shadow-xs font-mono text-[9px] leading-snug transition-all duration-300 hover:scale-[1.02] hover:shadow-sm" style={{ backgroundColor: '#E84E1B' }}>
                    <div className="space-y-0.5">
                      <div className="font-semibold opacity-90">C0 M80 Y95 K0</div>
                      <div className="font-semibold opacity-90">R232 G78 B27</div>
                      <div className="font-mono bg-black/15 px-1 py-0.5 rounded w-max">#E84E1B</div>
                    </div>
                    <div className="text-right font-black tracking-wider uppercase text-[9px] drop-shadow-xs">ORANGE</div>
                  </div>
                </td>

                {/* Secret */}
                <td className="p-2 bg-white align-top w-1/4">
                  <div className="rounded-md p-2 text-white flex flex-col justify-between h-22 shadow-xs font-mono text-[9px] leading-snug transition-all duration-300 hover:scale-[1.02] hover:shadow-sm" style={{ backgroundColor: '#E30513' }}>
                    <div className="space-y-0.5">
                      <div className="font-semibold opacity-90">C0 M100 Y100 K0</div>
                      <div className="font-semibold opacity-90">R227 G5 B19</div>
                      <div className="font-mono bg-black/15 px-1 py-0.5 rounded w-max">#E30513</div>
                    </div>
                    <div className="text-right font-black tracking-wider uppercase text-[9px] drop-shadow-xs">RED</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div key={`table-${key}`} className={`my-4 border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white ${tableClass} font-sans`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className={`bg-slate-50 border-b border-slate-300 font-extrabold text-slate-700 ${tableHeaderClass} uppercase tracking-wider`}>
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="p-2 border-r border-slate-200 text-left last:border-r-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-200 ${tableClass}`}>
            {rows.map((row, rIdx) => {
              // Row background or text color mapping
              let rowBg = rIdx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-50' : 'bg-white hover:bg-slate-50';
              let cellHighlights: { [colIdx: number]: string } = {};

              // Perform smart checks on columns to add styled badges
              row.forEach((cell, cIdx) => {
                const textVal = cell.replace(/\*/g, '').toLowerCase().trim();
                
                // Risk categories styling
                if (isRiskTable) {
                  if (textVal === 'low' || textVal.includes('1–20') || textVal.includes('1-20')) {
                    cellHighlights[cIdx] = 'bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider inline-block';
                  } else if (textVal === 'moderate' || textVal.includes('21–50') || textVal.includes('21-50')) {
                    cellHighlights[cIdx] = 'bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider inline-block';
                  } else if (textVal === 'high' || textVal.includes('51–75') || textVal.includes('51-75')) {
                    cellHighlights[cIdx] = 'bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider inline-block';
                  } else if (textVal === 'critical' || textVal.includes('76–125') || textVal.includes('76-125')) {
                    cellHighlights[cIdx] = 'bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[8px] uppercase tracking-wider inline-block';
                  }
                }

                // Classification Table Styling
                if (isClassificationTable) {
                  if (textVal === 'secret') {
                    cellHighlights[cIdx] = 'bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-rose-200 shadow-2xs';
                  } else if (textVal === 'confidential') {
                    cellHighlights[cIdx] = 'bg-orange-100 text-orange-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-orange-200 shadow-2xs';
                  } else if (textVal === 'restricted') {
                    cellHighlights[cIdx] = 'bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-blue-200 shadow-2xs';
                  } else if (textVal === 'public') {
                    cellHighlights[cIdx] = 'bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-emerald-200 shadow-2xs';
                  }
                }

                // Applicability Table Styling
                if (isApplicabilityTable) {
                  if (textVal === 'applicable') {
                    cellHighlights[cIdx] = 'bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-emerald-200 shadow-2xs';
                  } else if (textVal === 'not applicable' || textVal === 'not_applicable') {
                    cellHighlights[cIdx] = 'bg-slate-100 text-slate-500 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-slate-200 shadow-2xs';
                  }
                }

                // Change Classification badges
                if (textVal === 'emergency change') {
                  cellHighlights[cIdx] = 'bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-rose-200 shadow-2xs';
                } else if (textVal === 'major change') {
                  cellHighlights[cIdx] = 'bg-orange-100 text-orange-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-orange-200 shadow-2xs';
                } else if (textVal === 'minor change') {
                  cellHighlights[cIdx] = 'bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-blue-200 shadow-2xs';
                } else if (textVal === 'standard change') {
                  cellHighlights[cIdx] = 'bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider inline-block border border-emerald-200 shadow-2xs';
                }

                // Severity/Likelihood naming
                if (textVal === 'rare') {
                  cellHighlights[cIdx] = 'text-emerald-700 font-extrabold uppercase text-[9px]';
                } else if (textVal === 'unlikely' || textVal === 'minor') {
                  cellHighlights[cIdx] = 'text-teal-700 font-extrabold uppercase text-[9px]';
                } else if (textVal === 'possible' || textVal === 'moderate') {
                  cellHighlights[cIdx] = 'text-amber-700 font-extrabold uppercase text-[9px]';
                } else if (textVal === 'likely' || textVal === 'major') {
                  cellHighlights[cIdx] = 'text-orange-700 font-extrabold uppercase text-[9px]';
                } else if (textVal === 'almost certain' || textVal === 'critical') {
                  cellHighlights[cIdx] = 'text-rose-700 font-extrabold uppercase text-[9px]';
                }
              });

              return (
                <tr key={rIdx} className={rowBg}>
                  {headers.map((_, cIdx) => {
                    const val = row[cIdx] || '';
                    const highlightClass = cellHighlights[cIdx];
                    return (
                      <td key={cIdx} className="p-2.5 border-r border-slate-200 text-slate-700 last:border-r-0 leading-relaxed align-top">
                        {highlightClass ? (
                          <span className={highlightClass}>{val}</span>
                        ) : (
                          renderCellContent(val, renderInLineFormatting)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
