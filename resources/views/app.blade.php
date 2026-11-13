<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Favicon & Browser Tab Icons -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="shortcut icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/favicon.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Global Inspection & DevTools Protection -->
        <script>
            (function() {
                document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; }, { capture: true });
                document.addEventListener('keydown', function(e) {
                    var key = (e.key || '').toUpperCase();
                    var code = e.keyCode || e.which;
                    var isMod = e.ctrlKey || e.metaKey;
                    var isShiftOrAlt = e.shiftKey || e.altKey;

                    // F12
                    if (key === 'F12' || code === 123) {
                        e.preventDefault(); e.stopPropagation(); return false;
                    }
                    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K
                    if (isMod && isShiftOrAlt && (key === 'I' || key === 'J' || key === 'C' || key === 'K' || code === 73 || code === 74 || code === 67 || code === 75)) {
                        e.preventDefault(); e.stopPropagation(); return false;
                    }
                    // Ctrl+U (View Page Source)
                    if (isMod && (key === 'U' || code === 85)) {
                        e.preventDefault(); e.stopPropagation(); return false;
                    }
                }, { capture: true });
            })();
        </script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
