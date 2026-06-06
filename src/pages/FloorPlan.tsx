import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, HardDrive, Thermometer, ZoomIn, ZoomOut, Move, Info } from 'lucide-react';
import h337 from 'heatmap.js';
import type { FloorPlan as FloorPlanType, FloorArea, HeatmapData, LocationUpdate } from '@shared/types.js';
import { floorPlanApi } from '../utils/apiClient.js';
import Modal from '../components/ui/Modal.js';

const areaStatusColors: Record<string, string> = {
  active: 'border-green-500', idle: 'border-slate-400', dangerous: 'border-red-500',
};

export default function FloorPlan() {
  const [floorPlan, setFloorPlan] = useState<FloorPlanType | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [locations, setLocations] = useState<LocationUpdate[]>([]);
  const [selectedArea, setSelectedArea] = useState<FloorArea | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showHeatmap, setShowHeatmap] = useState(true);

  const heatmapContainerRef = useRef<HTMLDivElement>(null);
  const heatmapInstanceRef = useRef<h337.Heatmap | null>(null);
  const svgContainerRef = useRef<SVGSVGElement>(null);

  useEffect(() => { loadFloorPlanData(); }, []);

  useEffect(() => {
    if (heatmapContainerRef.current && floorPlan && !heatmapInstanceRef.current) {
      heatmapInstanceRef.current = h337.create({
        container: heatmapContainerRef.current,
        radius: 60,
        maxOpacity: 0.6,
        blur: 0.8,
        gradient: {
          0.25: 'rgb(0, 255, 0)',
          0.5: 'rgb(255, 255, 0)',
          0.75: 'rgb(255, 128, 0)',
          1.0: 'rgb(255, 0, 0)'
        }
      });
    }
  }, [floorPlan]);

  useEffect(() => {
    if (heatmapInstanceRef.current && locations.length > 0 && showHeatmap) {
      const maxValue = Math.max(locations.length * 5, 20);
      const points = locations.map(loc => ({
        x: Math.round(loc.x),
        y: Math.round(loc.y),
        value: loc.entityType === 'worker' ? 5 : 3
      }));
      heatmapInstanceRef.current.setData({
        max: maxValue,
        data: points
      });
    } else if (heatmapInstanceRef.current && !showHeatmap) {
      heatmapInstanceRef.current.setData({ max: 100, data: [] });
    }
  }, [locations, showHeatmap]);

  const loadFloorPlanData = async () => {
    try {
      const plans = await floorPlanApi.getFloorPlans() as FloorPlanType[];
      if (plans.length) {
        setFloorPlan(plans[0]);
        const [heatData, locData] = await Promise.all([
          floorPlanApi.getHeatmap(plans[0].projectId),
          floorPlanApi.getLocations(plans[0].projectId),
        ]);
        setHeatmap((heatData as { heatmapData: HeatmapData[] }).heatmapData);
        setLocations((locData as { locations: LocationUpdate[] }).locations);
      }
    } catch { /* 忽略错误 */ }
  };

  useEffect(() => {
    const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    const apiPort = import.meta.env.VITE_API_PORT || '3001';
    const ws = new WebSocket(`ws://${apiHost}:${apiPort}/ws`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'location_update') {
          setLocations(prev => {
            const idx = prev.findIndex(l => l.entityId === msg.data.entityId);
            return idx >= 0 ? prev.map((l, i) => i === idx ? msg.data : l) : [...prev, msg.data];
          });
        }
      } catch { /* 忽略解析错误 */ }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadFloorPlanData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.5, Math.min(3, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleAreaClick = (area: FloorArea) => { setSelectedArea(area); setIsDetailModalOpen(true); };
  const handleResetView = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
  const getAreaHeatmap = (areaId: string) => heatmap.find(h => h.areaId === areaId);
  const getAreaLocations = (areaName: string) => locations.filter(l => l.area === areaName);

  const workerLocations = locations.filter(l => l.entityType === 'worker');
  const equipmentLocations = locations.filter(l => l.entityType === 'equipment');

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <div className="bg-white border-b-2 border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800 font-display">施工平面图</h1>
          <span className="text-sm text-slate-500">{floorPlan?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`btn ${showHeatmap ? 'btn-primary' : 'btn-secondary'} py-1 text-sm`}
          >
            <Thermometer size={14} className="inline mr-1" />
            {showHeatmap ? '隐藏热力图' : '显示热力图'}
          </button>
          <button onClick={() => setScale(prev => Math.min(3, prev * 1.2))} className="btn btn-secondary py-1 px-3">
            <ZoomIn size={16} />
          </button>
          <button onClick={() => setScale(prev => Math.max(0.5, prev * 0.8))} className="btn btn-secondary py-1 px-3">
            <ZoomOut size={16} />
          </button>
          <button onClick={handleResetView} className="btn btn-secondary py-1 px-3">
            <Move size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-4 left-4 z-20 bg-white p-3 border-2 border-slate-200 text-sm space-y-2">
          <p className="font-semibold text-slate-700 mb-2">图例</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span className="text-slate-600 flex items-center gap-1"><Users size={12} />人员</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-slate-600 flex items-center gap-1"><HardDrive size={12} />设备</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
            <span className="text-slate-600">热力密度</span>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2">
            <p className="text-xs text-slate-500">缩放: {(scale * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-500">人员: {workerLocations.length}</p>
            <p className="text-xs text-slate-500">设备: {equipmentLocations.length}</p>
            <p className="text-xs text-green-600 font-medium">● 实时更新中</p>
          </div>
        </div>

        {floorPlan && (
          <div className="relative w-full h-full" onWheel={handleWheel}>
            <div
              ref={heatmapContainerRef}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                width: floorPlan.width,
                height: floorPlan.height
              }}
            />

            <svg
              ref={svgContainerRef}
              width="100%"
              height="100%"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`cursor-${isDragging ? 'grabbing' : 'grab'} absolute inset-0 z-10`}
            >
              <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
                <rect x="0" y="0" width={floorPlan.width} height={floorPlan.height} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
                {floorPlan.areas.map((area) => {
                  const locs = getAreaLocations(area.name);
                  return (
                    <g key={area.id}>
                      <rect
                        x={area.bounds.x} y={area.bounds.y}
                        width={area.bounds.width} height={area.bounds.height}
                        fill="transparent"
                        stroke={areaStatusColors[area.status] || '#94a3b8'}
                        strokeWidth="3"
                        className="cursor-pointer hover:fill-blue-50 hover:fill-opacity-30"
                        onClick={() => handleAreaClick(area)}
                      />
                      <text x={area.bounds.x + area.bounds.width / 2} y={area.bounds.y + 20} textAnchor="middle" className="text-xs fill-slate-700 font-medium pointer-events-none">
                        {area.name}
                      </text>
                      <text x={area.bounds.x + area.bounds.width / 2} y={area.bounds.y + 35} textAnchor="middle" className="text-xs fill-slate-500 pointer-events-none">
                        {area.type} · {locs.length}个对象
                      </text>
                    </g>
                  );
                })}
                {workerLocations.map((loc, idx) => (
                  <g key={`w-${loc.entityId}-${idx}`} className="pointer-events-none">
                    <circle cx={loc.x} cy={loc.y} r="10" fill="#3B82F6" stroke="white" strokeWidth="2">
                      <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text x={loc.x} y={loc.y + 4} textAnchor="middle" className="text-xs fill-white font-bold">
                      人
                    </text>
                  </g>
                ))}
                {equipmentLocations.map((loc, idx) => (
                  <g key={`e-${loc.entityId}-${idx}`} className="pointer-events-none">
                    <rect x={loc.x - 10} y={loc.y - 10} width="20" height="20" rx="2" fill="#F97316" stroke="white" strokeWidth="2">
                      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <text x={loc.x} y={loc.y + 5} textAnchor="middle" className="text-xs fill-white font-bold">
                      设
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
        )}
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="区域详情" size="md">
        {selectedArea && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100"><Info size={20} className="text-blue-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedArea.name}</h3>
                <p className="text-sm text-slate-500">{selectedArea.type}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3">
                <p className="text-xs text-slate-500">状态</p>
                <p className="font-medium text-slate-800">
                  {selectedArea.status === 'active' ? '活跃' : selectedArea.status === 'idle' ? '闲置' : '危险'}
                </p>
              </div>
              <div className="bg-slate-50 p-3">
                <p className="text-xs text-slate-500">对象数</p>
                <p className="font-medium text-slate-800">{getAreaLocations(selectedArea.name).length}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3">
              <p className="text-xs text-slate-500 mb-1">区域范围</p>
              <p className="text-xs text-slate-700">
                X: {selectedArea.bounds.x}-{selectedArea.bounds.x + selectedArea.bounds.width}
              </p>
              <p className="text-xs text-slate-700">
                Y: {selectedArea.bounds.y}-{selectedArea.bounds.y + selectedArea.bounds.height}
              </p>
              <p className="text-xs text-slate-700">
                面积: {selectedArea.bounds.width * selectedArea.bounds.height} px²
              </p>
            </div>
            {getAreaLocations(selectedArea.name).length ? (
              <div>
                <p className="text-xs text-slate-500 mb-1">位置对象</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {getAreaLocations(selectedArea.name).map((loc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-200">
                      {loc.entityType === 'worker'
                        ? <Users size={12} className="text-blue-600" />
                        : <HardDrive size={12} className="text-orange-600" />}
                      <span className="text-xs text-slate-700">
                        {loc.entityType === 'worker' ? '人员' : '设备'} {loc.entityId.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">({loc.x}, {loc.y})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {(() => {
              const heat = getAreaHeatmap(selectedArea.id);
              return heat ? (
                <div className="bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 mb-1">热力数据</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6" style={{
                      background: `rgb(${Math.round(255 * heat.intensity)}, ${Math.round(255 * (1 - heat.intensity))}, 0)`
                    }} />
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        强度: {(heat.intensity * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-500">人员: {heat.workerCount} · 设备: {heat.equipmentCount}</p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
