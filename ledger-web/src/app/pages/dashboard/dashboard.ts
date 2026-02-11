import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  
  stats: any = {
    total_assets: 0,
    total_liabilities: 0,
    net_income: 0,
    account_stats: { main_groups: 0, sub_accounts: 0 }
  };
  isLoading = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      // ✅ Added : any to fix TS7006
      next: (data: any) => {
        this.stats = data;
        this.isLoading = false;
      },
      // ✅ Added : any to fix TS7006
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}