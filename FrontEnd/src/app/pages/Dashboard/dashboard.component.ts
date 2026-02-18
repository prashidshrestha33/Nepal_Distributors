import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartOptions } from 'chart.js';

Chart.register(...registerables);

interface Order {
  id: number;
  customer: string;
  product: string;
  date: Date;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  stats = {
    totalOrders: 120,
    totalDeals: 85,
    totalProducts: 300,
    creditPoints: 4500
  };

  // Line chart
  lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [5000, 8000, 6000, 9000, 12000, 15000],
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.2)',
        fill: true
      }
    ]
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: true } }
  };

  // Pie chart
  pieChartData = {
    labels: ['Quotation Sent', 'Deals Closed'],
    datasets: [
      {
        data: [80, 45],
        backgroundColor: ['#4ade80', '#facc15']
      }
    ]
  };

  orders: Order[] = [
    { id: 1, customer: 'John Doe', product: 'Product A', date: new Date(), amount: 500, status: 'Pending' },
    { id: 2, customer: 'Jane Smith', product: 'Product B', date: new Date(), amount: 800, status: 'Completed' }
  ];
}
