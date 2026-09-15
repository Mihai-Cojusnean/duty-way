import { Component, computed, input } from '@angular/core';
import { ScheduleRecord } from '../../../interfaces/duty.interface';
import { ArcElement, Chart, ChartConfiguration, ChartOptions, Legend, registerables, Title, Tooltip } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ArcElement, Tooltip, Legend, Title);
Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-schedule-chart',
  imports: [BaseChartDirective],
  templateUrl: './schedule-chart.html',
  styleUrls: ['./schedule-chart.css'],
})
export class ScheduleChart {
  readonly records = input.required<ScheduleRecord[]>();
  readonly groupBy = input.required<(record: ScheduleRecord) => string>();

  public chartType = 'bar' as const;

  private readonly rowHeight = 20;
  private readonly chartPaddingY = 10;
  private readonly maxLabelLength = 22;

  readonly chartHeight = computed(() => {
    const count = this.chartData().labels?.length ?? 0;

    return count * this.rowHeight + this.chartPaddingY * 2;
  });

  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const counts: Record<string, number> = {};

    for (const record of this.records()) {
      const key = this.groupBy()(record) || 'Unknown';
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const values = Object.values(counts);
    const total = values.reduce((sum, value) => sum + value, 0);

    const labels = this.shortenLabels(counts);

    const percentages = values.map((value) => (total > 0 ? (value / total) * 100 : 0));

    return {
      labels,
      datasets: [
        {
          data: percentages,
          backgroundColor: 'rgb(255 255 255 / 0.61)',
          borderRadius: 4,
        },
      ],
    };
  });

  public chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    responsive: true,

    scales: {
      x: {
        display: false,
        min: 0,
        max: 140,
      },

      y: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#e7eaff',
        },
        afterFit: (scale) => {
          scale.width = 110;
        },
      },
    },

    plugins: {
      legend: {
        display: false,
      },

      datalabels: {
        anchor: 'end',
        align: 'right',
        offset: 6,
        clip: false,
        color: '#ffffff',

        formatter: (value: number) => {
          return `${value % 1 === 0 ? value : value.toFixed(1)}%`;
        },
      },
    },
  };

  private shortenLabels(counts: Record<string, number>) {
    return Object.keys(counts).map((label) => {
      let displayName = label;
      switch (label.replace(/\s/g, '')) {
        case 'CDG2-LACM(AC)':
          displayName = 'LACM';
          break;

        case 'CDG2-LSM7_LSM8(S3)porteL':
          displayName = 'LSM7 / LSM8';
          break;

        case 'CDG2-LEP1(TE)porteK':
          displayName = 'LEP1';
          break;

        case 'CDG2-LSM4(S4)porteM':
          displayName = 'LSM4';
          break;

        case 'CDG1-LAP1(T1)':
          displayName = 'LAP1';
          break;

        default:
          displayName = label;
      }

      return displayName.length > this.maxLabelLength
        ? `${displayName.slice(0, this.maxLabelLength - 3)}...`
        : displayName;
    });
  }
}
