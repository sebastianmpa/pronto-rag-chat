import { ApexOptions } from 'apexcharts';
import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { useEventCountByDay } from '../../hooks/useEventCountByDay';

function formatDayMonth(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  return `${day}`;
}

interface ChartBarProps {
  fechaIni: string;
  fechaFin: string;
  eventName?: string;
  titleKey?: string; // translation key for the chart title
  color?: string;
}

const ChartBar: React.FC<ChartBarProps> = ({
  fechaIni,
  fechaFin,
  eventName = 'conversation_start',
  titleKey = 'charts.conversationsStartedPerDay',
  color = '#06b6d4',
}) => {
  const { t } = useTranslation();

  const { data, loading, error } = useEventCountByDay({
    fechaIni,
    fechaFin,
    eventName,
  });

  const chartData = useMemo(() => {
    const categories = data.map((d) => d.date);
    const counts = data.map((d) => d.count);
    return { categories, counts };
  }, [data]);

  const xLabels = chartData.categories.map(formatDayMonth);

  const options: ApexOptions = {
    legend: { show: false },
    colors: [color],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      height: 320,
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      type: 'category',
      categories: xLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px' } },
    },
    tooltip: {
      x: {
        formatter: function (_value: any, opts: any) {
          return chartData.categories[opts.dataPointIndex] || '';
        },
      },
    },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    responsive: [
      { breakpoint: 1024, options: { chart: { height: 300 } } },
      { breakpoint: 1366, options: { chart: { height: 320 } } },
    ],
  };

  return (
    <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-title-sm2 font-bold text-black dark:text-white">
            {t(titleKey)}
          </h4>
        </div>
      </div>

      <div>
        <div id="chartBar" className="-ml-5">
          {loading ? (
            <div className="text-center py-10">{t('charts.loading')}</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{t('charts.errorLoadingData')}</div>
          ) : (
            <ReactApexChart
              options={options}
              series={[{ name: t('charts.conversations'), data: chartData.counts }]}
              type="bar"
              height={320}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartBar;
