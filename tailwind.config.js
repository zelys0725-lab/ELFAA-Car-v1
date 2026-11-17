import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                zinc: {
                    150: '#eceef1',
                    450: '#8b95a5',
                    550: '#626d7f',
                    650: '#464f5d',
                    750: '#333a46',
                    850: '#20242c',
                },
                brand: {
                    DEFAULT: '#B5100E',
                    dark: '#7A0C0A',
                    maroon: '#912C2C',
                    light: '#EBE2E0',
                    silver: '#B0B0B0',
                    charcoal: '#1A1A1A',
                },
            },
        },
    },

    plugins: [forms],
};
