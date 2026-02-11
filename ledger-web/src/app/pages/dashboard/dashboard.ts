import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for pipes like | currency
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  
  // Default values so the page doesn't crash while loading
  stats = {
    total_assets: 0,
    total_liabilities: 0,
    net_income: 0,
    account_stats: {
      main_groups: 0,
      sub_accounts: 0
    }
  };

  isLoading = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        console.log('Dashboard Data:', data); // Debugging
        this.stats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard:', err);
        this.isLoading = false;
      }
    });
  }
}