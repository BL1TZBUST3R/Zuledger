<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ResendMailer
{
    private const ENDPOINT = 'https://api.resend.com/emails';

    public function send(string $to, string $subject, string $html): bool
    {
        $apiKey = config('services.resend.key');
        $from   = config('services.resend.from');

        if (!$apiKey || !$from) {
            Log::warning('Resend not configured — skipping email send', ['to' => $to]);
            return false;
        }

        try {
            $response = Http::withToken($apiKey)
                ->timeout(10)
                ->post(self::ENDPOINT, [
                    'from'    => $from,
                    'to'      => [$to],
                    'subject' => $subject,
                    'html'    => $html,
                ]);

            if (!$response->successful()) {
                Log::warning('Resend send failed', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 300),
                ]);
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            Log::warning('Resend send threw: ' . $e->getMessage());
            return false;
        }
    }

    public function sendOtp(string $to, string $code, string $purpose = 'sign in'): bool
    {
        $appName = config('app.name', 'Zuledger');
        $subject = "{$appName} verification code";
        $html    = $this->otpTemplate($appName, $code, $purpose);
        return $this->send($to, $subject, $html);
    }

    private function otpTemplate(string $appName, string $code, string $purpose): string
    {
        $codeSafe = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');
        $purposeSafe = htmlspecialchars($purpose, ENT_QUOTES, 'UTF-8');
        $appSafe = htmlspecialchars($appName, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 40px 24px;">
          <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a;font-weight:700;">Verify it's you</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.5;">
            Use this code to {$purposeSafe} on {$appSafe}. The code expires in 10 minutes.
          </p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;text-align:center;font-family:'SF Mono',Menlo,monospace;">
            {$codeSafe}
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
            If you didn't request this, you can safely ignore this email — your account is still secure.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
    }
}
