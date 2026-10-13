<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        // Locked account check — admin has manually locked this user
        if ($request->user()->isLocked()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been locked by an administrator. Please contact support.',
            ]);
        }

        // Deactivated check
        if (! $request->user()->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        // Role authorization check
        if (! in_array($request->user()->role, $roles)) {
            // Return Inertia-rendered 403 page so the SPA displays correctly
            return Inertia::render('Errors/Error', [
                'status' => 403,
            ])->toResponse($request)->setStatusCode(403);
        }

        return $next($request);
    }
}
