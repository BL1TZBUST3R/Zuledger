<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Group;
use App\Models\User;
use App\Models\Ledger;

class GroupSeeder extends Seeder
{
    public function run($user = null, $ledger = null, $template = 'company')
    {
        if (!$user) {
            $user = User::first();
        }

        if (!$user || !$ledger) {
            return;
        }

        $templates = [
            'company'     => $this->companyTemplate(),
            'trust'       => $this->trustTemplate(),
            'partnership' => $this->partnershipTemplate(),
            'sole_trader' => $this->soleTraderTemplate(),
        ];

        $groups = $templates[$template] ?? $templates['company'];

        foreach ($groups as $group) {
            $parent = Group::create([
                'user_id'        => $user->id,
                'ledger_id'      => $ledger->id,
                'parent_id'      => null,
                'name'           => $group['name'],
                'code'           => $group['code'],
                'affects_gross'  => $group['affects_gross'] ?? 0,
                'account_type'   => $group['account_type'],
                'account_subtype'=> null,
                'cashflow_type'  => null,
                'normal_balance' => $group['normal_balance'],
            ]);

            foreach ($group['children'] ?? [] as $child) {
                Group::create([
                    'user_id'         => $user->id,
                    'ledger_id'       => $ledger->id,
                    'parent_id'       => $parent->id,
                    'name'            => $child['name'],
                    'code'            => $child['code'],
                    'affects_gross'   => $child['affects_gross'] ?? 0,
                    'account_type'    => $group['account_type'],
                    'account_subtype' => $child['account_subtype'] ?? null,
                    'cashflow_type'   => $child['cashflow_type'] ?? null,
                    'normal_balance'  => $group['normal_balance'],
                ]);
            }
        }
    }

    private function companyTemplate(): array
    {
        return [
            [
                'name' => 'Assets', 'code' => '1000', 'affects_gross' => 0,
                'account_type' => 'asset', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cash at Bank',        'code' => '1001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Accounts Receivable',  'code' => '1002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Inventory',            'code' => '1003', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Property & Equipment', 'code' => '1004', 'account_subtype' => 'non-current', 'cashflow_type' => 'investing'],
                ]
            ],
            [
                'name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0,
                'account_type' => 'liability', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Accounts Payable',   'code' => '2001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'GST Payable',         'code' => '2002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Bank Loan',           'code' => '2003', 'account_subtype' => 'non-current', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Equity', 'code' => '3000', 'affects_gross' => 0,
                'account_type' => 'equity', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Share Capital',    'code' => '3001', 'cashflow_type' => 'financing'],
                    ['name' => 'Retained Earnings','code' => '3002', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Revenue', 'code' => '4000', 'affects_gross' => 1,
                'account_type' => 'revenue', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Sales Revenue',   'code' => '4001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Other Income',    'code' => '4002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
            [
                'name' => 'Expenses', 'code' => '5000', 'affects_gross' => 1,
                'account_type' => 'expense', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cost of Goods Sold', 'code' => '5001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Rent Expense',        'code' => '5002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                    ['name' => 'Salaries Expense',    'code' => '5003', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                    ['name' => 'Depreciation',        'code' => '5004', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
        ];
    }

    private function trustTemplate(): array
    {
        return [
            [
                'name' => 'Assets', 'code' => '1000', 'affects_gross' => 0,
                'account_type' => 'asset', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cash at Bank',         'code' => '1001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Trust Receivables',    'code' => '1002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Trust Investments',    'code' => '1003', 'account_subtype' => 'non-current', 'cashflow_type' => 'investing'],
                ]
            ],
            [
                'name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0,
                'account_type' => 'liability', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Trust Payables',       'code' => '2001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Distributions Payable','code' => '2002', 'account_subtype' => 'current',     'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Trust Equity', 'code' => '3000', 'affects_gross' => 0,
                'account_type' => 'equity', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Trust Capital',        'code' => '3001', 'cashflow_type' => 'financing'],
                    ['name' => 'Undistributed Income', 'code' => '3002', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Revenue', 'code' => '4000', 'affects_gross' => 1,
                'account_type' => 'revenue', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Trust Income',         'code' => '4001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Investment Income',    'code' => '4002', 'account_subtype' => 'indirect', 'cashflow_type' => 'investing'],
                ]
            ],
            [
                'name' => 'Expenses', 'code' => '5000', 'affects_gross' => 1,
                'account_type' => 'expense', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Trust Administration', 'code' => '5001', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                    ['name' => 'Trustee Fees',         'code' => '5002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
        ];
    }

    private function partnershipTemplate(): array
    {
        return [
            [
                'name' => 'Assets', 'code' => '1000', 'affects_gross' => 0,
                'account_type' => 'asset', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cash at Bank',        'code' => '1001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Accounts Receivable', 'code' => '1002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Partnership Assets',  'code' => '1003', 'account_subtype' => 'non-current', 'cashflow_type' => 'investing'],
                ]
            ],
            [
                'name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0,
                'account_type' => 'liability', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Accounts Payable',    'code' => '2001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Partnership Loans',   'code' => '2002', 'account_subtype' => 'non-current', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Partners Equity', 'code' => '3000', 'affects_gross' => 0,
                'account_type' => 'equity', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Partner A Capital',   'code' => '3001', 'cashflow_type' => 'financing'],
                    ['name' => 'Partner B Capital',   'code' => '3002', 'cashflow_type' => 'financing'],
                    ['name' => 'Partners Drawings',   'code' => '3003', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Revenue', 'code' => '4000', 'affects_gross' => 1,
                'account_type' => 'revenue', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Partnership Revenue', 'code' => '4001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Other Income',        'code' => '4002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
            [
                'name' => 'Expenses', 'code' => '5000', 'affects_gross' => 1,
                'account_type' => 'expense', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cost of Sales',       'code' => '5001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Operating Expenses',  'code' => '5002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                    ['name' => 'Salaries Expense',    'code' => '5003', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
        ];
    }

    private function soleTraderTemplate(): array
    {
        return [
            [
                'name' => 'Assets', 'code' => '1000', 'affects_gross' => 0,
                'account_type' => 'asset', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cash at Bank',        'code' => '1001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Accounts Receivable', 'code' => '1002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'Equipment',           'code' => '1003', 'account_subtype' => 'non-current', 'cashflow_type' => 'investing'],
                ]
            ],
            [
                'name' => 'Liabilities', 'code' => '2000', 'affects_gross' => 0,
                'account_type' => 'liability', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Accounts Payable',    'code' => '2001', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                    ['name' => 'GST Payable',         'code' => '2002', 'account_subtype' => 'current',     'cashflow_type' => 'operating'],
                ]
            ],
            [
                'name' => "Owner's Equity", 'code' => '3000', 'affects_gross' => 0,
                'account_type' => 'equity', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => "Owner's Capital",     'code' => '3001', 'cashflow_type' => 'financing'],
                    ['name' => "Owner's Drawings",    'code' => '3002', 'cashflow_type' => 'financing'],
                ]
            ],
            [
                'name' => 'Revenue', 'code' => '4000', 'affects_gross' => 1,
                'account_type' => 'revenue', 'normal_balance' => 'CR',
                'children' => [
                    ['name' => 'Sales Revenue',       'code' => '4001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Other Income',        'code' => '4002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
            [
                'name' => 'Expenses', 'code' => '5000', 'affects_gross' => 1,
                'account_type' => 'expense', 'normal_balance' => 'DR',
                'children' => [
                    ['name' => 'Cost of Goods Sold',  'code' => '5001', 'account_subtype' => 'direct',   'cashflow_type' => 'operating'],
                    ['name' => 'Rent Expense',        'code' => '5002', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                    ['name' => 'Salaries Expense',    'code' => '5003', 'account_subtype' => 'indirect', 'cashflow_type' => 'operating'],
                ]
            ],
        ];
    }
}