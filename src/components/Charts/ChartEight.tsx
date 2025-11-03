import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useFoundStats } from '../../hooks/useFoundStats';

interface ChartEightProps {
  fechaIni: string;
  fechaFin: string;
}

const ChartEight: React.FC<ChartEightProps> = ({ fechaIni, fechaFin }) => {
  const { foundStats, fetchFoundStats, loading } = useFoundStats();
  const [series, setSeries] = useState<number[]>([0, 0]);

  useEffect(() => {
    fetchFoundStats(fechaIni, fechaFin);
    // eslint-disable-next-line
  }, [fechaIni, fechaFin]);

  useEffect(() => {
    if (foundStats?.stats) {
      setSeries([
        foundStats.stats.found,
        foundStats.stats.notFound,
      ]);
    }
  }, [foundStats]);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
    },
    colors: ['#0FADCF', '#3C50E0'],
    labels: ['Found', 'Not Found'],
    legend: {
      show: false,
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          background: 'transparent',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 250,
          },
        },
      },
    ],
  };

  return (
    <div className="sm:px-7.5 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-title-sm2 font-bold text-black dark:text-white">
            Found vs Not Found
          </h4>
        </div>
        <div className="mt-2 flex items-center sm:mt-0">
    
          <div className="relative z-20 inline-block">
            <select
              name="#"
              id="#"
              className="relative z-20 inline-flex appearance-none bg-transparent py-1 pl-3 pr-8 font-medium outline-none"
              disabled={loading}
            >
              <option value="" className="dark:bg-boxdark">
                Fixed range
              </option>
            </select>
            <span className="absolute right-1 top-1/2 z-10 -translate-y-1/2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.99995 12.8249C8.8312 12.8249 8.69058 12.7687 8.54995 12.6562L2.0812 6.2999C1.82808 6.04678 1.82808 5.65303 2.0812 5.3999C2.33433 5.14678 2.72808 5.14678 2.9812 5.3999L8.99995 11.278L15.0187 5.34365C15.2718 5.09053 15.6656 5.09053 15.9187 5.34365C16.1718 5.59678 16.1718 5.99053 15.9187 6.24365L9.44995 12.5999C9.30933 12.7405 9.1687 12.8249 8.99995 12.8249Z"
                  fill="#64748B"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <div className="mb-2">
        <div id="chartEight" className="mx-auto flex justify-center">
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="block h-4 w-4 rounded-full border-4 border-primary"></span>
            <span className="font-medium text-black-2 dark:text-white">
              Found
            </span>
          </div>
          <span className="inline-block rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-white">
            {foundStats?.stats?.foundPercent ?? 0}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="block h-4 w-4 rounded-full border-4 border-meta-10"></span>
            <span className="font-medium text-black-2 dark:text-white">
              Not Found
            </span>
          </div>
          <span className="inline-block rounded-md bg-meta-10 px-1.5 py-0.5 text-xs font-medium text-white">
            {foundStats?.stats?.notFoundPercent ?? 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChartEight;
