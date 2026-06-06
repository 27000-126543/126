declare module 'heatmap.js' {
  interface HeatmapConfig {
    container: HTMLElement;
    radius?: number;
    maxOpacity?: number;
    minOpacity?: number;
    blur?: number;
    gradient?: Record<number, string>;
    backgroundColor?: string;
    visible?: boolean;
    onExtremaChange?: () => void;
  }

  interface DataPoint {
    x: number;
    y: number;
    value: number;
  }

  interface HeatmapData {
    max: number;
    min?: number;
    data: DataPoint[];
  }

  interface Heatmap {
    setData(data: HeatmapData): void;
    addData(data: DataPoint | DataPoint[]): void;
    removeData(x: number, y: number): void;
    getData(): HeatmapData;
    getValueAt(x: number, y: number): number;
    resize(): void;
    repaint(): void;
    dispose(): void;
  }

  function create(config: HeatmapConfig): Heatmap;
}
