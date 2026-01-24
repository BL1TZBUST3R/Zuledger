import { Routes } from '@angular/router';

// 👇 NOTICE: These point to "dashboard" and "account-list" (matching your file names)
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AccountListComponent } from './pages/account-list/account-list';

export const routes: Routes = [
    // 1. Default to Dashboard
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    
    // 2. The Dashboard Page
    { path: 'dashboard', component: DashboardComponent },
    
    // 3. The Accounts Page
    { path: 'accounts', component: AccountListComponent } 
];