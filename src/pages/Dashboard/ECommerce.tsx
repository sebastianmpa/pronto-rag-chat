import React, { useEffect, useState } from 'react';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartThree from '../../components/Charts/ChartThree';
import ChartTwo from '../../components/Charts/ChartTwo';
import ChatCard from '../../components/Chat/ChatCard';
import MapOne from '../../components/Maps/MapOne';
import TableOne from '../../components/Tables/TableOne';
import ChartEight from '../../components/Charts/ChartEight';

import ChartSeven from '../../components/Charts/ChartSeven';
import DataStatsThree from '../../components/DataStats/DataStatsThree';
import DefaultLayout from '../../layout/DefaultLayout';
import { useStatsTops } from '../../hooks/useStats';
import { useEventStats } from '../../hooks/useEventStats';
import { useFoundStats } from '../../hooks/useFoundStats';
import StatsBarChart from '../../components/features/stats/StatsBarChart';

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setMonth(end.getMonth() - 1);
  return {
    fechaIni: start.toISOString().split('T')[0] + 'T00:00:00Z',
    fechaFin: end.toISOString().split('T')[0] + 'T23:59:59Z',
  };
}

const ECommerce: React.FC = () => {
  const [dates, setDates] = useState(getDefaultDates());
  const { stats, loading: loadingStats, fetchStatsTops } = useStatsTops();
  const { eventStats, loading: loadingEvents, fetchEventStats } = useEventStats();
  const { foundStats, loading: loadingFound, fetchFoundStats } = useFoundStats();

  useEffect(() => {
    fetchStatsTops(dates.fechaIni, dates.fechaFin);
    fetchEventStats(dates.fechaIni, dates.fechaFin);
    fetchFoundStats(dates.fechaIni, dates.fechaFin);
  }, [fetchStatsTops, fetchEventStats, fetchFoundStats, dates]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStamp = e.target.name === 'fechaFin' ? 'T23:59:59Z' : 'T00:00:00Z';
    setDates((prev) => ({ ...prev, [e.target.name]: e.target.value + timeStamp }));
  };

  return (
    <DefaultLayout>
      {/* Date Picker Section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title-md2 font-bold text-black dark:text-white">
            Dashboard Analytics
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Select date range to view analytics data
          </p>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-boxdark rounded-lg px-4 py-2 shadow-sm border border-slate-200 dark:border-strokedark">
          <label className="font-medium text-black dark:text-white mr-2">Start date:</label>
          <input
            type="date"
            name="fechaIni"
            value={dates.fechaIni.slice(0, 10)}
            onChange={handleDateChange}
            className="border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-base font-semibold bg-white dark:bg-boxdark text-blue-900 dark:text-blue-200 shadow-sm"
          />
          <label className="font-medium text-black dark:text-white mx-2">End date:</label>
          <input
            type="date"
            name="fechaFin"
            value={dates.fechaFin.slice(0, 10)}
            onChange={handleDateChange}
            className="border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-base font-semibold bg-white dark:bg-boxdark text-blue-900 dark:text-blue-200 shadow-sm"
          />
          </div>
        </div>
      </div>

      <DataStatsThree fechaIni={dates.fechaIni} fechaFin={dates.fechaFin} />
      <div className="mt-7.5 grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-7">
          <ChartSeven fechaIni={dates.fechaIni} fechaFin={dates.fechaFin} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <ChartEight fechaIni={dates.fechaIni} fechaFin={dates.fechaFin} />
        </div>
       
      </div>
      {/* Aquí podrías agregar gráficos y tablas usando los datos de stats, eventStats y foundStats */}
      
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
        {/* Top Models Bar Chart */}
        {stats?.stats.topModels && stats.stats.topModels.length > 0 && (
          <StatsBarChart
            title="Most Frequent Models"
            categories={stats.stats.topModels.map((m) => m.model || 'N/A')}
            data={stats.stats.topModels.map((m) => Number(m.total))}
            color="#3C50E0"
            startDate={dates.fechaIni}
            endDate={dates.fechaFin}
          />
        )}
        {/* Top Part Types Bar Chart */}  
        {stats?.stats.topPartTypes && stats.stats.topPartTypes.length > 0 && (
          <StatsBarChart
            title="Most Frequent Part Types"
            categories={stats.stats.topPartTypes.map((p) => p.part_type || 'N/A')}
            data={stats.stats.topPartTypes.map((p) => Number(p.total))}
            color="#10B981"
            startDate={dates.fechaIni}
            endDate={dates.fechaFin}
          />
        )}
        {/* Eventos por tipo Bar Chart */}
        {eventStats?.stats && eventStats.stats.length > 0 && (
          <StatsBarChart
            title="Events by Type"
            categories={eventStats.stats.map((e) => e.event || 'N/A')}
            data={eventStats.stats.map((e) => Number(e.total))}
            color="#6366F1"
            startDate={dates.fechaIni}
            endDate={dates.fechaFin}
          />
        )}
      </div>
    </DefaultLayout>
  );
};

export default ECommerce;
