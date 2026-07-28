<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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

        // Deactivated check
        if (! $request->user()->isActive()) {
            \Illuminate\Support\Facades\Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        if (! in_array($request->user()->role, $roles)) {
            // Redirect to their respective dashboards if they have mismatched roles
            if ($request->user()->isAdmin() || $request->user()->isStaff()) {
                return redirect()->route('admin.dashboard');
            }
            return redirect()->route('client.dashboard');
        }

        return $next($request);
    }
}
