import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useEventStats } from '../../hooks/useEventStats';

// Define event groups - only has and has_no events
const MODEL_EVENTS = [
  'has_model',
  'has_no_model',
];
const PURCHASE_EVENTS = [
  'has_purchase',
  'has_no_purchase',
];
const MANUAL_EVENTS = [
  'has_manual',
  'has_no_manual',
];

const getGroupStats = (stats, eventList) => {
  if (!stats) return { total: 0, items: [] };
  const items = eventList.map(event => {
    const found = stats.find(e => e.event === event);
    return { event, total: Number(found?.total || 0) };
  });
  const total = items.reduce((sum, item) => sum + item.total, 0);
  return { total, items };
};

const getDonutOptions = (labels, colors) => ({
  chart: { type: 'donut' as const },
  labels,
  colors,
  legend: { show: false },
  plotOptions: { pie: { donut: { size: '75%' } } },
  dataLabels: { enabled: false },
  responsive: [
    { breakpoint: 2600, options: { chart: { width: 120 } } },
    { breakpoint: 640, options: { chart: { width: 80 } } },
  ],
});

const COLORS = {
  modelos: ['#3C50E0', '#6366F1'],
  compras: ['#10B981', '#34D399'],
  manuales: ['#F59E0B', '#FBBF24'],
};

interface DataStatsThreeProps {
  fechaIni: string;
  fechaFin: string;
}

const DataStatsThree: React.FC<DataStatsThreeProps> = ({ fechaIni, fechaFin }) => {
  const { eventStats, fetchEventStats } = useEventStats();
  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetchEventStats(fechaIni, fechaFin);
  }, [fechaIni, fechaFin, fetchEventStats]);

  useEffect(() => {
    if (eventStats?.stats) setStats(eventStats.stats);
  }, [eventStats]);

  // Get stats for each group
  const modelos = getGroupStats(stats, MODEL_EVENTS);
  const compras = getGroupStats(stats, PURCHASE_EVENTS);
  const manuales = getGroupStats(stats, MANUAL_EVENTS);

  return (
        <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-sm2 font-bold text-black dark:text-white">
            Analytics Overview
          </h2>
        </div>
      </div>
      <div className="2xl:gap-7.5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
        {/* Models */}
        <div className="xl:p-7.5 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-2 text-title-lg font-bold text-black dark:text-white">
                {modelos.total}
              </h3>
              <p className="font-medium">Models</p>
            </div>
            <div>
              <ReactApexChart
                options={getDonutOptions(
                  modelos.items.map(i => i.event),
                  COLORS.modelos
                )}
                series={modelos.items.map(i => i.total)}
                type="donut"
                width={120}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {modelos.items.map((item, index) => (
              <div key={item.event} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="block h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS.modelos[index] }}
                  ></span>
                  <span className="text-xs font-medium text-black-2 dark:text-white">
                    {item.event.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs font-medium text-black-2 dark:text-white">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Purchases */}
        <div className="xl:p-7.5 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-2 text-title-lg font-bold text-black dark:text-white">
                {compras.total}
              </h3>
              <p className="font-medium">Purchases</p>
            </div>
            <div>
              <ReactApexChart
                options={getDonutOptions(
                  compras.items.map(i => i.event),
                  COLORS.compras
                )}
                series={compras.items.map(i => i.total)}
                type="donut"
                width={120}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {compras.items.map((item, index) => (
              <div key={item.event} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="block h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS.compras[index] }}
                  ></span>
                  <span className="text-xs font-medium text-black-2 dark:text-white">
                    {item.event.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs font-medium text-black-2 dark:text-white">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Manuals */}
        <div className="xl:p-7.5 rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-2 text-title-lg font-bold text-black dark:text-white">
                {manuales.total}
              </h3>
              <p className="font-medium">Manuals</p>
            </div>
            <div>
              <ReactApexChart
                options={getDonutOptions(
                  manuales.items.map(i => i.event),
                  COLORS.manuales
                )}
                series={manuales.items.map(i => i.total)}
                type="donut"
                width={120}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {manuales.items.map((item, index) => (
              <div key={item.event} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="block h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS.manuales[index] }}
                  ></span>
                  <span className="text-xs font-medium text-black-2 dark:text-white">
                    {item.event.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs font-medium text-black-2 dark:text-white">
                  {item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStatsThree;
