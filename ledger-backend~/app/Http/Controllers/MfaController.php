<?php

namespace App\Http\Controllers;

use App\Models\MfaTrustedDevice;
use App\Models\User;
use App\Services\ResendMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MfaController extends Controller
{
    private const CODE_TTL_MINUTES = 10;
    private const RESEND_COOLDOWN_SECONDS = 60;
    private const MAX_VERIFY_ATTEMPTS = 5;
    private const TRUST_DEVICE_DAYS = 30;

    public function __construct(private ResendMailer $mailer) {}

    /**
     * GET /api/mfa/status
     * Returns whether MFA is enabled for the authenticated user.
     */
    public function status()
    {
        $user = Auth::user();
        $devices = $user->mfaTrustedDevices()
            ->where('expires_at', '>', now())
            ->orderByDesc('last_used_at')
            ->get(['id', 'label', 'user_agent', 'ip_address', 'last_used_at', 'expires_at', 'created_at']);

        return response()->json([
            'mfa_enabled'     => (bool) $user->mfa_enabled,
            'trusted_devices' => $devices,
        ]);
    }

    /**
     * POST /api/mfa/enable
     * Sends an OTP to the user's email so they can confirm enabling MFA.
     */
    public function enable(Request $request)
    {
        $user = Auth::user();

        if ($user->mfa_enabled) {
            return response()->json(['message' => 'MFA is already enabled.'], 422);
        }

        $this->issueCode($user, 'enable MFA');

        return response()->json([
            'message' => 'Verification code sent to your email.',
        ]);
    }

    /**
     * POST /api/mfa/confirm-enable
     * Verifies the OTP and turns MFA on.
     */
    public function confirmEnable(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = Auth::user();

        if ($user->mfa_enabled) {
            return response()->json(['message' => 'MFA is already enabled.'], 422);
        }

        if (!$this->verifyCodeAgainst($user, $request->code)) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        $user->forceFill([
            'mfa_enabled'         => true,
            'mfa_code_hash'       => null,
            'mfa_code_expires_at' => null,
            'mfa_challenge'       => null,
            'mfa_attempts'        => 0,
        ])->save();

        return response()->json(['message' => 'MFA enabled.']);
    }

    /**
     * POST /api/mfa/disable
     * Requires the current account password.
     */
    public function disable(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = Auth::user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        $user->forceFill([
            'mfa_enabled'         => false,
            'mfa_code_hash'       => null,
            'mfa_code_expires_at' => null,
            'mfa_challenge'       => null,
            'mfa_attempts'        => 0,
        ])->save();

        $user->mfaTrustedDevices()->delete();

        return response()->json(['message' => 'MFA disabled.']);
    }

    /**
     * POST /api/mfa/verify
     * Public endpoint used during login. Takes a challenge id + 6-digit code.
     * On success returns a Sanctum token (and optional trust token).
     */
    public function verify(Request $request)
    {
        $request->validate([
            'challenge'       => 'required|string',
            'code'            => 'required|string|size:6',
            'remember_device' => 'nullable|boolean',
        ]);

        $user = User::where('mfa_challenge', $request->challenge)->first();

        if (!$user || !$user->mfa_enabled) {
            return response()->json(['message' => 'Invalid challenge.'], 422);
        }

        if ($user->mfa_attempts >= self::MAX_VERIFY_ATTEMPTS) {
            $this->clearChallenge($user);
            return response()->json(['message' => 'Too many attempts. Please sign in again.'], 429);
        }

        if (!$this->verifyCodeAgainst($user, $request->code)) {
            $user->increment('mfa_attempts');
            $remaining = max(0, self::MAX_VERIFY_ATTEMPTS - $user->mfa_attempts);
            return response()->json([
                'message'             => 'Invalid or expired code.',
                'attempts_remaining'  => $remaining,
            ], 422);
        }

        $this->clearChallenge($user);

        $token = $user->createToken('myapptoken')->plainTextToken;

        $payload = [
            'user'  => $user,
            'token' => $token,
        ];

        if ($request->boolean('remember_device')) {
            $payload['trust_token'] = $this->issueTrustToken($user, $request);
        }

        return response()->json($payload);
    }

    /**
     * POST /api/mfa/resend
     * Resends the OTP for an active login challenge.
     */
    public function resend(Request $request)
    {
        $request->validate(['challenge' => 'required|string']);

        $user = User::where('mfa_challenge', $request->challenge)->first();
        if (!$user || !$user->mfa_enabled) {
            return response()->json(['message' => 'Invalid challenge.'], 422);
        }

        if ($user->mfa_code_sent_at && $user->mfa_code_sent_at->diffInSeconds(now()) < self::RESEND_COOLDOWN_SECONDS) {
            $wait = self::RESEND_COOLDOWN_SECONDS - $user->mfa_code_sent_at->diffInSeconds(now());
            return response()->json([
                'message'      => "Please wait {$wait}s before requesting another code.",
                'retry_after'  => $wait,
            ], 429);
        }

        $challenge = $this->issueCode($user, 'sign in', $user->mfa_challenge);

        return response()->json([
            'message'   => 'A new code has been sent.',
            'challenge' => $challenge,
        ]);
    }

    /**
     * POST /api/mfa/trusted-devices/{id}/revoke
     */
    public function revokeDevice($id)
    {
        $user = Auth::user();
        $device = $user->mfaTrustedDevices()->findOrFail($id);
        $device->delete();
        return response()->json(['message' => 'Device revoked.']);
    }

    /**
     * Generate a fresh 6-digit code, hash it on the user, and email it.
     * Returns the challenge id (existing or freshly minted).
     */
    public function issueCode(User $user, string $purpose, ?string $reuseChallenge = null): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $challenge = $reuseChallenge ?: Str::random(48);

        $user->forceFill([
            'mfa_challenge'       => $challenge,
            'mfa_code_hash'       => Hash::make($code),
            'mfa_code_expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'mfa_code_sent_at'    => now(),
            'mfa_attempts'        => 0,
        ])->save();

        $this->mailer->sendOtp($user->email, $code, $purpose);

        return $challenge;
    }

    /**
     * Issue a long-lived trust token for the current device.
     * Returns the raw token (only shown once); only the hash is persisted.
     */
    public function issueTrustToken(User $user, Request $request): string
    {
        $raw = Str::random(64);
        $user->mfaTrustedDevices()->create([
            'token_hash'   => hash('sha256', $raw),
            'user_agent'   => substr((string) $request->userAgent(), 0, 500),
            'ip_address'   => $request->ip(),
            'last_used_at' => now(),
            'expires_at'   => now()->addDays(self::TRUST_DEVICE_DAYS),
        ]);
        return $raw;
    }

    /**
     * Validate and consume a trust token. Returns true if the token belongs
     * to the user and is still active. Updates last_used_at on hit.
     */
    public function consumeTrustToken(User $user, string $rawToken): bool
    {
        $device = $user->mfaTrustedDevices()
            ->where('token_hash', hash('sha256', $rawToken))
            ->where('expires_at', '>', now())
            ->first();

        if (!$device) return false;

        $device->update(['last_used_at' => now()]);
        return true;
    }

    private function verifyCodeAgainst(User $user, string $code): bool
    {
        if (!$user->mfa_code_hash || !$user->mfa_code_expires_at) return false;
        if ($user->mfa_code_expires_at->isPast()) return false;
        return Hash::check($code, $user->mfa_code_hash);
    }

    private function clearChallenge(User $user): void
    {
        $user->forceFill([
            'mfa_challenge'       => null,
            'mfa_code_hash'       => null,
            'mfa_code_expires_at' => null,
            'mfa_attempts'        => 0,
        ])->save();
    }
}
