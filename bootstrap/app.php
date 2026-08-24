<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->redirectTo(
            guests: '/login',
            users: function (Request $request) {
                if ($request->user()) {
                    return ($request->user()->isAdmin() || $request->user()->isStaff())
                        ? route('admin.dashboard')
                        : '/';
                }
                return '/';
            }
        );

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'nocache' => \App\Http\Middleware\SetNoCacheHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, Request $request) {
            if (in_array($response->getStatusCode(), [403, 404, 500, 503])) {
                return \Inertia\Inertia::render('Errors/Error', [
                    'status' => $response->getStatusCode(),
                    'message' => $exception->getMessage() ?: null,
                ])->toResponse($request)->setStatusCode($response->getStatusCode());
            }
            return $response;
        });
    })->create();
