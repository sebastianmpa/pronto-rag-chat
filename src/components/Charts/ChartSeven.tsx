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

interface ChartSevenProps {
  fechaIni: string;
  fechaFin: string;
}

const ChartSeven: React.FC<ChartSevenProps> = ({ fechaIni, fechaFin }) => {
  const { t } = useTranslation();
  const { data, loading, error } = useEventCountByDay({
    fechaIni,
    fechaFin,
    eventName: 'conversation_start',
  });

  // Genera los labels y datos para el gráfico
  const chartData = useMemo(() => {
    const categories = data.map((d) => d.date);
    const counts = data.map((d) => d.count);
    return { categories, counts };
  }, [data]);

  // Formatea los labels del eje X solo con el día
  const xLabels = chartData.categories.map(formatDayMonth);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: 'top',
      horizontalAlign: 'left',
    },
    colors: ['#3C50E0'],
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      height: 310,
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 320,
          },
        },
      },
    ],
    stroke: {
      curve: 'smooth',
    },
    markers: {
      size: 0,
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      fixed: {
        enabled: false,
      },
      x: {
        show: true,
        formatter: function (_value: any, opts: any) {
          // Muestra la fecha completa en el tooltip
          return chartData.categories[opts.dataPointIndex] || '';
        },
      },
      y: {
        title: {
          formatter: function () {
            return '';
          },
        },
      },
      marker: {
        show: false,
      },
    },
    xaxis: {
      type: 'category',
      categories: xLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '12px' },
        formatter: function (value: string, _index: number) {
          // Solo muestra el número del día
          return value;
        },
      },
      // Agrega los meses como labels en el eje X usando tickAmount y custom formatter
      tickAmount: xLabels.length,
    },
    annotations: {}, // Elimina las anotaciones de mes en el eje Y
    yaxis: {
      title: {
        style: {
          fontSize: '0px',
        },
      },
    },
  };

  return (
    <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-title-sm2 font-bold text-black dark:text-white">
            {t('charts.conversationsStartedPerDay')}
          </h4>
        </div>
      </div>
      <div>
        <div id="chartSeven" className="-ml-5">
          {loading ? (
            <div className="text-center py-10">{t('charts.loading')}</div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{t('charts.errorLoadingData')}</div>
          ) : (
            <ReactApexChart
              options={options}
              series={[{ name: t('charts.conversations'), data: chartData.counts }]}
              type="area"
              height={310}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartSeven;
