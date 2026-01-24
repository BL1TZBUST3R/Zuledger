import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AccountListComponent } from './pages/account-list/account-list';
import { RegisterComponent } from './pages/register/register'; 
import { LoginComponent } from './pages/login/login';          

export const routes: Routes = [
    // Public Routes
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    // Protected Routes (We will group these later)
    { path: 'dashboard', component: DashboardComponent },
    { path: 'accounts', component: AccountListComponent },
    
    // Default
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];