import { useState, useRef, useEffect } from 'react';
import { FileText, Download, TrendingUp, AlertTriangle, Clock, HardDrive, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Project, ProgressStat, MaterialStat, SafetyStat, EquipmentStat } from '../../shared/types.js';
import { projectApi, statisticsApi } from '../utils/apiClient.js';
import StatCard from '../components/ui/StatCard.js';

const reportTypes = [
  { value: 'progress', label: '进度报告' },
  { value: 'safety', label: '安全报告' },
  { value: 'equipment', label: '设备报告' },
  { value: 'material', label: '材料报告' },
  { value: 'comprehensive', label: '综合报告' },
];

export default function ReportExport() {
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('comprehensive');
  const [projects, setProjects] = useState<Project[]>([]);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<{
    progress?: ProgressStat[];
    material?: MaterialStat[];
    safety?: SafetyStat[];
    equipment?: EquipmentStat[];
  }>({});
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId || startDate || endDate) {
      loadReportData();
    }
  }, [projectId, startDate, endDate, reportType]);

  const loadProjects = async () => {
    const data = await projectApi.getProjects();
    setProjects(data as Project[]);
  };

  const loadReportData = async () => {
    const params = { projectId: projectId || undefined, startDate: startDate || undefined, endDate: endDate || undefined };
    const needs = (t: string) => reportType === t || reportType === 'comprehensive';
    const requests = [
      needs('progress') && statisticsApi.getProgressStats(params),
      needs('material') && statisticsApi.getMaterialStats(params),
      needs('safety') && statisticsApi.getSafetyStats(params),
      needs('equipment') && statisticsApi.getEquipmentStats(params),
    ].filter(Boolean) as Promise<unknown>[];

    const results = await Promise.all(requests);
    let idx = 0;
    setReportData({
      ...(needs('progress') ? { progress: results[idx++] as ProgressStat[] } : {}),
      ...(needs('material') ? { material: results[idx++] as MaterialStat[] } : {}),
      ...(needs('safety') ? { safety: results[idx++] as SafetyStat[] } : {}),
      ...(needs('equipment') ? { equipment: results[idx++] as EquipmentStat[] } : {}),
    });
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportProgress(10);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      setExportProgress(40);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const { width: pdfWidth, height: pdfHeight } = pdf.internal.pageSize;
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgX = (pdfWidth - canvas.width * ratio) / 2;
      setExportProgress(70);
      let position = 0, heightLeft = canvas.height * ratio;
      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', imgX, position, canvas.width * ratio, canvas.height * ratio);
        heightLeft -= pdfHeight;
        if (heightLeft >= 0) { pdf.addPage(); position -= pdfHeight; }
      }
      setExportProgress(95);
      pdf.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setExportProgress(100);
      setTimeout(() => { setIsExporting(false); setExportProgress(0); }, 1000);
    } catch {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getProjectName = () => {
    return projects.find(p => p.id === projectId)?.name || '全部项目';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display">报告导出</h1>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={18} />
          {isExporting ? `导出中 ${exportProgress}%` : '生成PDF报告'}
        </button>
      </div>

      {isExporting && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">导出进度</span>
            <span className="text-sm font-medium text-blue-600">{exportProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 h-3">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="card p-4 mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          报告参数配置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">项目</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
            >
              <option value="">全部项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">报告类型</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">报告预览</h3>
        <div ref={reportRef} className="bg-white min-h-96">
          <div className="border-b-2 border-slate-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 font-display">
              {reportTypes.find(rt => rt.value === reportType)?.label}
            </h2>
            <p className="text-slate-500 mt-1">
              项目: {getProjectName()} | 周期: {startDate || '开始'} 至 {endDate || '结束'}
            </p>
            <p className="text-slate-400 text-sm">生成时间: {new Date().toLocaleString('zh-CN')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {reportData.progress && (
              <StatCard
                title="平均完成率"
                value={`${(reportData.progress.reduce((s, p) => s + p.completionRate, 0) / reportData.progress.length).toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
                color="blue"
              />
            )}
            {reportData.safety && (
              <StatCard
                title="安全事故数"
                value={reportData.safety.reduce((s, i) => s + i.incidents, 0)}
                icon={<AlertTriangle size={20} />}
                color="red"
              />
            )}
            {reportData.equipment && (
              <StatCard
                title="设备数量"
                value={reportData.equipment.length}
                icon={<HardDrive size={20} />}
                color="orange"
              />
            )}
            {reportData.material && (
              <StatCard
                title="材料种类"
                value={reportData.material.length}
                icon={<Clock size={20} />}
                color="green"
              />
            )}
          </div>

          {reportData.progress?.length ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">进度详情</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="text-left px-3 py-2">项目</th>
                  <th className="text-left px-3 py-2">计划</th>
                  <th className="text-left px-3 py-2">实际</th>
                  <th className="text-left px-3 py-2">完成率</th>
                </tr></thead>
                <tbody>{reportData.progress.map((p) => (
                  <tr key={p.projectId} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">{p.projectName}</td>
                    <td className="px-3 py-2">{p.plannedProgress}%</td>
                    <td className="px-3 py-2">{p.actualProgress}%</td>
                    <td className={`px-3 py-2 font-medium ${p.completionRate >= 100 ? 'text-green-600' : p.completionRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {p.completionRate}%
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}

          {reportData.safety?.length ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">安全统计</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="text-left px-3 py-2">周期</th>
                  <th className="text-left px-3 py-2">总报警</th>
                  <th className="text-left px-3 py-2">严重</th>
                  <th className="text-left px-3 py-2">事故</th>
                </tr></thead>
                <tbody>{reportData.safety.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="px-3 py-2">{s.period}</td>
                    <td className="px-3 py-2">{s.totalAlarms}</td>
                    <td className="px-3 py-2 text-red-600">{s.criticalAlarms}</td>
                    <td className="px-3 py-2">{s.incidents}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}

          {reportData.equipment?.length ? (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">设备利用率</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="text-left px-3 py-2">设备</th>
                  <th className="text-left px-3 py-2">时长</th>
                  <th className="text-left px-3 py-2">利用率</th>
                  <th className="text-left px-3 py-2">状态</th>
                </tr></thead>
                <tbody>{reportData.equipment.map((e) => (
                  <tr key={e.equipmentId} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">{e.equipmentName}</td>
                    <td className="px-3 py-2">{e.totalRuntime}h</td>
                    <td className="px-3 py-2">{e.utilizationRate}%</td>
                    <td className={`px-3 py-2 ${e.utilizationRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {e.utilizationRate >= 80 ? '良好' : '待提升'}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
