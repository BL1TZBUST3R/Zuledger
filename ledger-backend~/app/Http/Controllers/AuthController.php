<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Database\Seeders\GroupSeeder;
use App\Http\Controllers\MfaController;

class AuthController extends Controller
{
    public function __construct(private MfaController $mfa) {}

    // 1. REGISTER NEW ACCOUNTANT
    public function register(Request $request) {
        // Validate incoming data
        $fields = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|unique:users,email',
            'password' => 'required|string|confirmed' 
        ]);

        // Create the user
        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password'])
        ]);

        // 👇 2. ADD THIS BLOCK: Run the seeder for this new user
        $seeder = new GroupSeeder();
        $seeder->run($user);
        // 👆 END NEW BLOCK

        // Create a security token
        $token = $user->createToken('myapptoken')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ], 201);
    }

    // 2. LOGIN EXISTING ACCOUNTANT
    public function login(Request $request) {
        $fields = $request->validate([
            'email'       => 'required|string',
            'password'    => 'required|string',
            'trust_token' => 'nullable|string',
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json(['message' => 'Bad credentials'], 401);
        }

        // MFA gate — if enabled and the device isn't already trusted, issue a
        // challenge instead of a session token.
        if ($user->mfa_enabled) {
            $trusted = !empty($fields['trust_token'])
                && $this->mfa->consumeTrustToken($user, $fields['trust_token']);

            if (!$trusted) {
                $challenge = $this->mfa->issueCode($user, 'sign in');
                return response()->json([
                    'mfa_required' => true,
                    'challenge'    => $challenge,
                    'email_hint'   => $this->maskEmail($user->email),
                ], 200);
            }
        }

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 200);
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2) + [null, null];
        if (!$local || !$domain) return $email;
        $visible = substr($local, 0, min(2, strlen($local)));
        return $visible . str_repeat('•', max(1, strlen($local) - strlen($visible))) . '@' . $domain;
    }
    
    // 3. LOGOUT
    public function logout(Request $request) {
        auth()->user()->tokens()->delete();
        return [
            'message' => 'Logged out'
        ];
    }
}