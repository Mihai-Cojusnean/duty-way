import { Component, computed, input } from '@angular/core';
import { ScheduleRecord } from '../../../interfaces/duty.interface';
import { ChartConfiguration, ChartOptions, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ArcElement, Legend, Title, Tooltip } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, Title);
Chart.register(...registerables);

@Component({
  selector: 'app-schedule-chart',
  imports: [BaseChartDirective],
  templateUrl: './schedule-chart.html',
  styleUrls: ['./schedule-chart.css'],
})
export class ScheduleChart {
  readonly records = input.required<ScheduleRecord[]>();

  public chartType = 'pie' as const;

  readonly chartData = computed<ChartConfiguration<'pie'>['data']>(() => {
    const data = this.records() || [];
    const counts: { [brand: string]: number } = {};

    for (const record of data) {
      const brand = record.brand || 'Unknown';
      counts[brand] = (counts[brand] || 0) + 1;
    }

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#e87c11', '#42a2b8'],
          borderColor: 'transparent',
          borderWidth: 0,
        },
      ],
    };
  });

  public chartOptions: ChartOptions<'pie'> = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
      },
    },
  };
}
