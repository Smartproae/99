import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Client, Audit, AuditFinding } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, Filter, Layers, ExternalLink, RefreshCw, BarChart2, Info } from 'lucide-react';

interface AuditComplianceHeatmapProps {
  client: Client;
  audits: Audit[];
  findings: AuditFinding[];
  onNavigateTab: (tab: string) => void;
}

type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type YDimensionMode = 'finding_type' | 'audit_type' | 'status';

interface HeatmapCellData {
  xSeverity: SeverityLevel;
  yCategory: string;
  count: number;
  findings: AuditFinding[];
  maxCountInMatrix: number;
}

const SEVERITIES: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export default function AuditComplianceHeatmap({
  client,
  audits,
  findings,
  onNavigateTab,
}: AuditComplianceHeatmapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [yDimension, setYDimension] = useState<YDimensionMode>('finding_type');
  const [selectedCell, setSelectedCell] = useState<{
    severity: SeverityLevel;
    category: string;
  } | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    visible: boolean;
    data: HeatmapCellData | null;
  }>({ x: 0, y: 0, visible: false, data: null });

  // 1. Filter findings for current client
  const clientAudits = useMemo(() => {
    return audits.filter(a => a.client_id === client.id);
  }, [audits, client.id]);

  const clientAuditMap = useMemo(() => {
    const map = new Map<string, Audit>();
    clientAudits.forEach(a => map.set(a.id, a));
    return map;
  }, [clientAudits]);

  const clientFindings = useMemo(() => {
    return findings.filter(f => clientAuditMap.has(f.audit_id));
  }, [findings, clientAuditMap]);

  // Normalize severity string
  const getNormalizedSeverity = (sev: string): SeverityLevel => {
    const uppercase = (sev || '').toUpperCase();
    if (uppercase === 'CRITICAL') return 'Critical';
    if (uppercase === 'HIGH') return 'High';
    if (uppercase === 'MEDIUM') return 'Medium';
    return 'Low';
  };

  // Y-axis Categories depending on dimension mode
  const yCategories = useMemo(() => {
    if (yDimension === 'finding_type') {
      return ['NC Major', 'NC Minor', 'Opportunity for Improvement (OFI)'];
    }
    if (yDimension === 'audit_type') {
      return ['Regulatory Audit', 'Internal Audit', 'External Certification'];
    }
    return ['Open', 'Resolving', 'Closed'];
  }, [yDimension]);

  // Helper to map a finding to Y-axis category
  const getFindingYCategory = (f: AuditFinding): string => {
    const audit = clientAuditMap.get(f.audit_id);
    if (yDimension === 'finding_type') {
      if (f.finding_type === 'NC_MAJOR') return 'NC Major';
      if (f.finding_type === 'NC_MINOR') return 'NC Minor';
      return 'Opportunity for Improvement (OFI)';
    }
    if (yDimension === 'audit_type') {
      if (audit?.audit_type === 'REGULATORY') return 'Regulatory Audit';
      if (audit?.audit_type === 'EXTERNAL') return 'External Certification';
      return 'Internal Audit';
    }
    // status
    if (f.status === 'CLOSED') return 'Closed';
    if (f.status === 'RESOLVING') return 'Resolving';
    return 'Open';
  };

  // 2. Build 2D Matrix of counts
  const { matrixData, maxCellCount } = useMemo(() => {
    const data: HeatmapCellData[] = [];
    let maxCount = 0;

    SEVERITIES.forEach(sev => {
      yCategories.forEach(cat => {
        const cellFindings = clientFindings.filter(f => {
          const matchingSev = getNormalizedSeverity(f.severity) === sev;
          const matchingCat = getFindingYCategory(f) === cat;
          return matchingSev && matchingCat;
        });

        if (cellFindings.length > maxCount) {
          maxCount = cellFindings.length;
        }

        data.push({
          xSeverity: sev,
          yCategory: cat,
          count: cellFindings.length,
          findings: cellFindings,
          maxCountInMatrix: 0,
        });
      });
    });

    data.forEach(d => {
      d.maxCountInMatrix = maxCount;
    });

    return { matrixData: data, maxCellCount: maxCount };
  }, [clientFindings, SEVERITIES, yCategories, yDimension, clientAuditMap]);

  // Metrics summary
  const totalFindingsCount = clientFindings.length;
  const criticalCount = clientFindings.filter(f => getNormalizedSeverity(f.severity) === 'Critical').length;
  const highCount = clientFindings.filter(f => getNormalizedSeverity(f.severity) === 'High').length;
  const mediumCount = clientFindings.filter(f => getNormalizedSeverity(f.severity) === 'Medium').length;
  const lowCount = clientFindings.filter(f => getNormalizedSeverity(f.severity) === 'Low').length;
  const closedCount = clientFindings.filter(f => f.status === 'CLOSED').length;
  const resolutionRate = totalFindingsCount > 0 ? Math.round((closedCount / totalFindingsCount) * 100) : 100;

  // Selected findings filter
  const activeCellFindings = useMemo(() => {
    if (!selectedCell) return clientFindings;
    return clientFindings.filter(f => {
      const matchSev = getNormalizedSeverity(f.severity) === selectedCell.severity;
      const matchCat = getFindingYCategory(f) === selectedCell.category;
      return matchSev && matchCat;
    });
  }, [selectedCell, clientFindings, yDimension, clientAuditMap]);

  // Color scale generator based on severity column and intensity
  const getCellFillColor = (sev: SeverityLevel, count: number, maxCount: number) => {
    if (count === 0) return '#f8fafc'; // subtle slate-50 when empty

    const ratio = Math.min(Math.max(count / Math.max(maxCount, 1), 0.25), 1);

    if (sev === 'Critical') {
      const scale = d3.scaleLinear<string>()
        .domain([0, 1])
        .range(['#fecdd3', '#e11d48']); // rose-200 to rose-600
      return scale(ratio);
    }
    if (sev === 'High') {
      const scale = d3.scaleLinear<string>()
        .domain([0, 1])
        .range(['#fed7aa', '#ea580c']); // orange-200 to orange-600
      return scale(ratio);
    }
    if (sev === 'Medium') {
      const scale = d3.scaleLinear<string>()
        .domain([0, 1])
        .range(['#fef08a', '#ca8a04']); // yellow-200 to yellow-600
      return scale(ratio);
    }
    // Low
    const scale = d3.scaleLinear<string>()
      .domain([0, 1])
      .range(['#bbf7d0', '#16a34a']); // emerald-200 to emerald-600
    return scale(ratio);
  };

  const getCellTextColor = (sev: SeverityLevel, count: number) => {
    if (count === 0) return '#cbd5e1';
    if (sev === 'Critical' || sev === 'High') return '#ffffff';
    if (sev === 'Medium') return count > 1 ? '#451a03' : '#713f12';
    return count > 2 ? '#ffffff' : '#064e3b';
  };

  // 3. Render D3 Visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 580;
    const height = 310;
    const margin = { top: 35, right: 25, bottom: 45, left: 160 };

    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', containerWidth).attr('height', height);

    // D3 Scales
    const xScale = d3.scaleBand<SeverityLevel>()
      .domain(SEVERITIES)
      .range([0, innerWidth])
      .padding(0.12);

    const yScale = d3.scaleBand<string>()
      .domain(yCategories)
      .range([0, innerHeight])
      .padding(0.12);

    const mainGroup = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw background grid lines / card guides
    mainGroup.selectAll('.grid-line-x')
      .data(SEVERITIES)
      .enter()
      .append('line')
      .attr('x1', d => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y1', -10)
      .attr('x2', d => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y2', innerHeight + 5)
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '3,3');

    // Draw Cells
    const cells = mainGroup.selectAll('.heatmap-cell')
      .data(matrixData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr('transform', (d: HeatmapCellData) => `translate(${xScale(d.xSeverity) || 0}, ${yScale(d.yCategory) || 0})`)
      .style('cursor', 'pointer');

    // Rect
    cells.append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', (d: HeatmapCellData) => getCellFillColor(d.xSeverity, d.count, maxCellCount))
      .attr('stroke', (d: HeatmapCellData) => {
        const isSelected = selectedCell?.severity === d.xSeverity && selectedCell?.category === d.yCategory;
        if (isSelected) return '#0f172a';
        return d.count > 0 ? 'rgba(15, 23, 42, 0.08)' : '#e2e8f0';
      })
      .attr('stroke-width', (d: HeatmapCellData) => {
        const isSelected = selectedCell?.severity === d.xSeverity && selectedCell?.category === d.yCategory;
        return isSelected ? 3 : 1;
      })
      .attr('stroke-dasharray', (d: HeatmapCellData) => d.count === 0 ? '4,4' : 'none')
      .style('transition', 'all 0.25s ease-in-out');

    // Count text inside cell
    cells.append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + (yScale.bandwidth() > 60 ? -2 : 4))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d: HeatmapCellData) => getCellTextColor(d.xSeverity, d.count))
      .attr('font-size', (d: HeatmapCellData) => d.count > 0 ? '18px' : '12px')
      .attr('font-weight', (d: HeatmapCellData) => d.count > 0 ? '900' : '500')
      .attr('font-family', 'ui-monospace, monospace')
      .text((d: HeatmapCellData) => d.count > 0 ? d.count : '0');

    // Sub-label inside cell if space permits
    cells.filter((d: HeatmapCellData) => d.count > 0 && yScale.bandwidth() > 55)
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 16)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d: HeatmapCellData) => getCellTextColor(d.xSeverity, d.count))
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('opacity', 0.85)
      .text((d: HeatmapCellData) => `${Math.round((d.count / Math.max(totalFindingsCount, 1)) * 100)}%`);

    // Interactions
    cells
      .on('mouseenter', (event, d: HeatmapCellData) => {
        d3.select(event.currentTarget).select('rect')
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2.5)
          .style('filter', 'drop-shadow(0 4px 6px rgba(15,23,42,0.12))');

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            visible: true,
            data: d,
          });
        }
      })
      .on('mousemove', (event) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip(prev => ({
            ...prev,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          }));
        }
      })
      .on('mouseleave', (event, d: HeatmapCellData) => {
        const isSelected = selectedCell?.severity === d.xSeverity && selectedCell?.category === d.yCategory;
        d3.select(event.currentTarget).select('rect')
          .attr('stroke', isSelected ? '#0f172a' : (d.count > 0 ? 'rgba(15, 23, 42, 0.08)' : '#e2e8f0'))
          .attr('stroke-width', isSelected ? 3 : 1)
          .style('filter', 'none');

        setTooltip(prev => ({ ...prev, visible: false }));
      })
      .on('click', (event, d: HeatmapCellData) => {
        if (selectedCell?.severity === d.xSeverity && selectedCell?.category === d.yCategory) {
          setSelectedCell(null);
        } else {
          setSelectedCell({ severity: d.xSeverity, category: d.yCategory });
        }
      });

    // Draw X-Axis Labels (Severities)
    SEVERITIES.forEach(sev => {
      const xPos = (xScale(sev) || 0) + xScale.bandwidth() / 2;
      const xGroup = mainGroup.append('g')
        .attr('transform', `translate(${xPos}, ${innerHeight + 18})`);

      // Color dot badge for severity
      const dotColor = sev === 'Critical' ? '#e11d48' : sev === 'High' ? '#ea580c' : sev === 'Medium' ? '#ca8a04' : '#16a34a';
      
      xGroup.append('circle')
        .attr('cx', -28)
        .attr('cy', -2)
        .attr('r', 4)
        .attr('fill', dotColor);

      xGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#334155')
        .attr('font-size', '11px')
        .attr('font-weight', '800')
        .text(sev);

      xGroup.append('text')
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(sev === 'Critical' ? 'Immediate Risk' : sev === 'High' ? 'Major Risk' : sev === 'Medium' ? 'Moderate Risk' : 'Minor Risk');
    });

    // Draw Y-Axis Labels (Categories)
    yCategories.forEach(cat => {
      const yPos = (yScale(cat) || 0) + yScale.bandwidth() / 2;
      const yGroup = mainGroup.append('g')
        .attr('transform', `translate(-12, ${yPos})`);

      const labelText = cat.length > 22 ? cat.substring(0, 20) + '…' : cat;

      yGroup.append('text')
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#1e293b')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(labelText);
    });

    // Axis titles
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.05em')
      .text('AUDIT FINDING RISK SEVERITY SPECTRUM ➔');

    svg.append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('letter-spacing', '0.05em')
      .text(
        yDimension === 'finding_type' 
          ? 'FINDING CLASSIFICATION' 
          : yDimension === 'audit_type' 
            ? 'AUDIT TYPE' 
            : 'STATUS'
      );

  }, [matrixData, yCategories, selectedCell, totalFindingsCount, maxCellCount, yDimension]);

  return (
    <div id="compliance-findings-heatmap-widget" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              D3 Intelligence Heatmap
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">
              {client.company_name}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            Audit Findings Risk Severity Heatmap
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-dimensional D3 density distribution of regulatory and compliance audit findings mapped across <strong className="text-slate-700">Low, Medium, High, and Critical</strong> risk severities.
          </p>
        </div>

        {/* Interactive Dimension Toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Group By:
          </span>
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
            <button
              onClick={() => {
                setYDimension('finding_type');
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                yDimension === 'finding_type'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finding Type
            </button>
            <button
              onClick={() => {
                setYDimension('audit_type');
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                yDimension === 'audit_type'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Type
            </button>
            <button
              onClick={() => {
                setYDimension('status');
                setSelectedCell(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                yDimension === 'status'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Finding Status
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Findings</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalFindingsCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">{clientAudits.length} Audits</span>
          </div>
        </div>

        <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Critical</span>
            {criticalCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-800 font-mono">{criticalCount}</span>
            <span className="text-[10px] text-rose-600 font-bold">
              {totalFindingsCount > 0 ? Math.round((criticalCount / totalFindingsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">High Severity</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-orange-800 font-mono">{highCount}</span>
            <span className="text-[10px] text-orange-600 font-bold">
              {totalFindingsCount > 0 ? Math.round((highCount / totalFindingsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Medium Severity</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-800 font-mono">{mediumCount}</span>
            <span className="text-[10px] text-amber-600 font-bold">
              {totalFindingsCount > 0 ? Math.round((mediumCount / totalFindingsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Low Severity</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-800 font-mono">{lowCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold">
              {totalFindingsCount > 0 ? Math.round((lowCount / totalFindingsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Resolution Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-900 font-mono">{resolutionRate}%</span>
            <span className="text-[10px] text-indigo-600 font-bold">{closedCount} Closed</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* D3 Heatmap SVG Container */}
        <div ref={containerRef} className="lg:col-span-7 bg-slate-50/60 rounded-2xl p-4 border border-slate-100 relative min-h-[350px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Interactive 2D Severity Distribution Grid
            </span>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Low
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto flex justify-center">
            <svg ref={svgRef} className="mx-auto" />
          </div>

          {/* D3 Tooltip overlay */}
          {tooltip.visible && tooltip.data && (
            <div
              className="absolute z-20 pointer-events-none bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs transition-opacity duration-150"
              style={{
                left: Math.min(tooltip.x + 10, (containerRef.current?.clientWidth || 500) - 220),
                top: Math.max(tooltip.y - 80, 10),
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                <span className="font-extrabold text-amber-400 text-[11px]">
                  {tooltip.data.xSeverity} Severity
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">
                  {tooltip.data.count} {tooltip.data.count === 1 ? 'Finding' : 'Findings'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Category: <strong className="text-white">{tooltip.data.yCategory}</strong>
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Click this cell to inspect the corresponding audit findings breakdown.
              </p>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-500" />
              Click any colored cell in the matrix to filter specific finding items.
            </span>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Reset Matrix Filter
              </button>
            )}
          </div>
        </div>

        {/* Drill-down Findings Drawer */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Audit Findings Inspection
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  {selectedCell ? (
                    <span className="text-indigo-600">
                      {selectedCell.severity} Severity findings in &quot;{selectedCell.category}&quot;
                    </span>
                  ) : (
                    `All Client Audit Findings (${activeCellFindings.length})`
                  )}
                </h4>
              </div>
              {selectedCell && (
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-[10px] font-extrabold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Selection ✕
                </button>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1 flex-1">
              {activeCellFindings.length > 0 ? (
                activeCellFindings.map(f => {
                  const audit = clientAuditMap.get(f.audit_id);
                  const normSev = getNormalizedSeverity(f.severity);

                  const sevColorClass = 
                    normSev === 'Critical' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    normSev === 'High' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                    normSev === 'Medium' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-emerald-50 text-emerald-800 border-emerald-200';

                  const statusColorClass =
                    f.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                    f.status === 'RESOLVING' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800';

                  return (
                    <div
                      key={f.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100 transition-colors rounded-xl border border-slate-150 space-y-2 text-left"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                          {f.finding_no}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${sevColorClass}`}>
                            {normSev}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusColorClass}`}>
                            {f.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {f.finding_description}
                      </p>

                      <div className="bg-white p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600 leading-snug">
                        <strong className="text-slate-800 font-bold block mb-0.5">Recommendation:</strong>
                        {f.recommendation}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-150">
                        <span>Audit Ref: {audit?.audit_number || f.audit_id}</span>
                        <span className="font-semibold text-slate-500">
                          Type: {f.finding_type === 'NC_MAJOR' ? 'NC Major' : f.finding_type === 'NC_MINOR' ? 'NC Minor' : 'OFI'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-500">
                    No findings recorded for this specific severity & category combination.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('audits')}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View Audit Module</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('capa')}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-200"
            >
              <span>View CAPA Actions</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
