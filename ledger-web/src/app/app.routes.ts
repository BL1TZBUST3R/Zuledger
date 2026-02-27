import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AccountListComponent } from './pages/account-list/account-list';
import { RegisterComponent } from './pages/register/register'; 
import { LoginComponent } from './pages/login/login';          
import { JournalEntryComponent } from './pages/journal-entry/journal-entry'
import { LedgerComponent } from './pages/ledger/ledger';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'accounts/:id', component: AccountListComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'journal', component: JournalEntryComponent },
    { path: 'ledger/:id', component: LedgerComponent },
];