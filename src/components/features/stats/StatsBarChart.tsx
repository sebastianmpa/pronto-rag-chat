import { ApexOptions } from 'apexcharts';
import React from 'react';
import ReactApexChart from 'react-apexcharts';

interface StatsBarChartProps {
  title: string;
  categories: string[];
  data: number[];
  color?: string;
  height?: number;
  startDate?: string;
  endDate?: string;
}

const StatsBarChart: React.FC<StatsBarChartProps> = ({ title, categories, data, color = '#3C50E0', height = 350, startDate, endDate }) => {
  const options: ApexOptions = {
    colors: [color],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'bar',
      height,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 2,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ['transparent'] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontFamily: 'Satoshi',
      markers: { radius: 99 },
    },
    grid: {
      yaxis: { lines: { show: false } },
      xaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: any) => val },
    },
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
        {startDate && endDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{startDate.slice(0,10)} - {endDate.slice(0,10)}</span>
        )}
      </div>
      <div className="mb-2">
        <div className="-ml-5">
          <ReactApexChart options={options} series={[{ data }]} type="bar" height={height} />
        </div>
      </div>
    </div>
  );
};

export default StatsBarChart;
