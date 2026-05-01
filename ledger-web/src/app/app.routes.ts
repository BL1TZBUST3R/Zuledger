import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AccountListComponent } from './pages/account-list/account-list';
import { RegisterComponent } from './pages/register/register';
import { LoginComponent } from './pages/login/login';
import { MfaVerifyComponent } from './pages/mfa-verify/mfa-verify';
import { JournalEntryComponent } from './pages/journal-entry/journal-entry'
import { LedgerComponent } from './pages/ledger/ledger';
import { ReportsComponent } from './pages/reports/reports';
import { SettingsComponent } from './pages/settings/settings';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'mfa-verify', component: MfaVerifyComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'accounts/:id', component: AccountListComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'ledger/:id/journal', component: JournalEntryComponent },
    { path: 'ledger/:id/reports', component: ReportsComponent },
    { path: 'ledger/:id', component: LedgerComponent },
    { path: 'ledger/:id/settings', component: SettingsComponent },
];