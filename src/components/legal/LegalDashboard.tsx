import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Scale, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  CalendarRange 
} from 'lucide-react';
import { LegalRequirement, CircularItem, StandardItem, ComplianceDoc } from '../../utils/legalData';

interface LegalDashboardProps {
  requirements: LegalRequirement[];
  circulars: CircularItem[];
  standards: StandardItem[];
  docs: ComplianceDoc[];
}

export default function LegalDashboard({ requirements, circulars, standards, docs }: LegalDashboardProps) {
  // 1. Calculate KPI Metrics
  const totalReqs = requirements.length;
  const totalCircs = circulars.length;
  const totalStds = standards.length;
  const totalDocsCount = docs.length;

  const reqCompliant = requirements.filter(r => r.compliance_status === 'Fully Compliant').length;
  const reqPartial = requirements.filter(r => r.compliance_status === 'Partially Compliant').length;
  const reqNon = requirements.filter(r => r.compliance_status === 'Non-Compliant').length;
  const reqNA = requirements.filter(r => r.compliance_status === 'Not Applicable').length;

  // Global Compliance Score: (Compliant items across all registers) / (Total non-NA items)
  const allItems = [...requirements, ...circulars, ...standards];
  const activeItems = allItems.filter(item => item.compliance_status !== 'Not Applicable');
  const compliantItems = allItems.filter(item => item.compliance_status === 'Fully Compliant');
  const complianceScore = activeItems.length > 0 
    ? Math.round((compliantItems.length / activeItems.length) * 100) 
    : 100;

  // Documents status count
  const validDocs = docs.filter(d => d.status === 'Valid').length;
  const expiredDocs = docs.filter(d => d.status === 'Expired').length;
  const renewalDocs = docs.filter(d => d.status === 'Renewal Due').length;

  // 2. Prepare Chart Data
  // Pie Chart: Overall Compliance Status
  const pieData = [
    { name: 'Fully Compliant', value: allItems.filter(i => i.compliance_status === 'Fully Compliant').length, color: '#10B981' },
    { name: 'Partially Compliant', value: allItems.filter(i => i.compliance_status === 'Partially Compliant').length, color: '#F59E0B' },
    { name: 'Non-Compliant', value: allItems.filter(i => i.compliance_status === 'Non-Compliant').length, color: '#EF4444' },
    { name: 'Not Applicable', value: allItems.filter(i => i.compliance_status === 'Not Applicable').length, color: '#64748B' }
  ].filter(d => d.value > 0);

  // Bar Chart: Authority-wise requirements count
  const authCount: Record<string, { compliant: number, total: number }> = {};
  requirements.forEach(r => {
    const auth = r.authority.split(' (')[0].substring(0, 20); // Shorten
    if (!authCount[auth]) authCount[auth] = { compliant: 0, total: 0 };
    authCount[auth].total += 1;
    if (r.compliance_status === 'Fully Compliant') authCount[auth].compliant += 1;
  });
  const authData = Object.keys(authCount).map(key => ({
    name: key,
    Compliant: authCount[key].compliant,
    Total: authCount[key].total
  }));

  // Bar Chart: Category-wise requirements distribution
  const catCount: Record<string, number> = {};
  requirements.forEach(r => {
    catCount[r.category] = (catCount[r.category] || 0) + 1;
  });
  const categoryData = Object.keys(catCount).map(key => ({
    category: key,
    Count: catCount[key]
  })).slice(0, 6); // Top 6

  // Monthly completion status simulator
  const monthlyData = [
    { month: 'Feb 2026', Compliant: 12, Total: 16 },
    { month: 'Mar 2026', Compliant: 15, Total: 18 },
    { month: 'Apr 2026', Compliant: 18, Total: 20 },
    { month: 'May 2026', Compliant: 20, Total: 22 },
    { month: 'Jun 2026', Compliant: 23, Total: 25 },
    { month: 'Jul 2026', Compliant: compliantItems.length, Total: allItems.length }
  ];

  return (
    <div id="legal-compliance-dashboard" className="space-y-6">
      {/* 1. Header KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div id="kpi-total-legal" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Requirements</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{totalReqs}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> {reqCompliant} Fully Compliant
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Scale className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div id="kpi-compliance-score" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Compliance Score</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{complianceScore}%</span>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              Active standard controls active
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div id="kpi-circulars" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">DOH Circulars & Standards</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{totalCircs + totalStds}</span>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> {circulars.filter(c => c.compliance_status === 'Non-Compliant').length} Non-Compliant
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileText className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div id="kpi-compliance-docs" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mandatory Licenses</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{totalDocsCount}</span>
            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> {expiredDocs} Expired / {renewalDocs} Due
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Chart Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Global Compliance Distribution (Pie) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Overall Compliance Distribution</h3>
          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-800">{complianceScore}%</span>
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Score</span>
            </div>
          </div>
          <div className="mt-2 space-y-1 text-[10px] font-semibold text-slate-600 grid grid-cols-2 gap-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Authority-wise breakdown */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Authority-wise Requirements & Status</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={authData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Compliant" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Total" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 3: Category Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Category-wise Controls Coverage</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 8, fill: '#475569' }} width={80} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="Count" fill="#4338CA" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monthly Completion Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Historical Compliance Progress Timeline</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Compliant" fill="#10B981" name="Fully Compliant Controls" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Total" fill="#E2E8F0" name="Total Controls Tracked" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
