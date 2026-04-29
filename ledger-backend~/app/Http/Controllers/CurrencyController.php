<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyController extends Controller
{
    private const CACHE_TTL_SECONDS = 3600; // 1 hour
    private const PROVIDER_URL = 'https://open.er-api.com/v6/latest/USD';

    /**
     * GET /api/currency/rates
     * Returns USD-based rates. Cached for 1 hour. Falls back to a
     * static table if the upstream provider is unreachable.
     */
    public function rates(Request $request)
    {
        $refresh = $request->boolean('refresh', false);

        if ($refresh) {
            Cache::forget('fx_rates_usd');
        }

        $payload = Cache::remember('fx_rates_usd', self::CACHE_TTL_SECONDS, function () {
            try {
                $response = Http::timeout(5)->get(self::PROVIDER_URL);

                if ($response->successful()) {
                    $data = $response->json();
                    if (($data['result'] ?? null) === 'success' && !empty($data['rates'])) {
                        return [
                            'base'    => 'USD',
                            'rates'   => $data['rates'],
                            'source'  => 'open.er-api.com',
                            'updated' => $data['time_last_update_utc']
                                ?? now()->toIso8601String(),
                            'live'    => true,
                        ];
                    }
                }

                Log::warning('FX provider returned unexpected payload', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 300),
                ]);
            } catch (\Throwable $e) {
                Log::warning('FX provider unreachable: ' . $e->getMessage());
            }

            return $this->staticFallback();
        });

        return response()->json($payload);
    }

    private function staticFallback(): array
    {
        return [
            'base'    => 'USD',
            'source'  => 'static-fallback',
            'updated' => now()->toIso8601String(),
            'live'    => false,
            'rates'   => [
                'USD' => 1,
                'EUR' => 0.92,
                'GBP' => 0.79,
                'AUD' => 1.52,
                'NZD' => 1.65,
                'CAD' => 1.36,
                'JPY' => 151.0,
                'CNY' => 7.24,
                'HKD' => 7.82,
                'SGD' => 1.34,
                'INR' => 83.3,
                'PHP' => 56.5,
                'IDR' => 15780,
                'THB' => 36.2,
                'MYR' => 4.72,
                'KRW' => 1340,
                'CHF' => 0.89,
                'SEK' => 10.5,
                'NOK' => 10.7,
                'DKK' => 6.87,
                'ZAR' => 18.7,
                'MXN' => 17.1,
                'BRL' => 5.05,
                'AED' => 3.67,
                'SAR' => 3.75,
            ],
        ];
    }
}
