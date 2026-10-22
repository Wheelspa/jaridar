/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
        },
        extend: {
            fontFamily: {
                heading: ['Lato', 'sans-serif'],
                body: ['Lato', 'sans-serif'],
                accent: ['Lato', 'sans-serif'],
            },
            colors: {
                wine: {
                    DEFAULT: '#C2255C',
                    dark: '#9C1D49',
                    light: '#FBF0EC',
                },
                'wine-dark': '#9C1D49',
                blue: {
                    DEFAULT: '#3B6FA0',
                    light: '#E8F0F8',
                    dark: '#2C547A',
                    hover: '#2C547A',
                },
                'blue-light': '#E8F0F8',
                cream: '#FFFFFF',
                ivory: {
                    DEFAULT: '#FFFFFF',
                    soft: '#FFFFFF',
                    warm: '#FFFFFF',
                    light: '#FFFFFF',
                },
                'rose-tint': '#FBF0EC',
                border: '#E5E7EB',
                'text-primary': '#1F2937',
                'text-secondary': '#4B5563',
                'text-light': '#9CA3AF',
                'footer-dark': '#FFFFFF',
                rose: {
                    DEFAULT: '#C2255C',
                    hover: '#9C1D49',
                    light: '#FBF0EC',
                    tint: '#FBF0EC',
                    dark: '#9C1D49',
                    decorative: '#C2255C',
                    50: '#FBF0EC',
                    100: '#FBF0EC',
                    500: '#C2255C',
                    600: '#C2255C',
                    700: '#9C1D49',
                },
                blush: {
                    DEFAULT: '#C2255C',
                    light: '#FBF0EC',
                    tint: '#FBF0EC',
                    dark: '#9C1D49',
                },
                gold: {
                    DEFAULT: '#C2255C',
                    light: '#E8F0F8',
                    dark: '#9C1D49',
                    text: '#3B6FA0',
                },
                serenity: {
                    DEFAULT: '#3B6FA0',
                    light: '#E8F0F8',
                    dark: '#2C547A',
                },
                beige: {
                    DEFAULT: '#FFFFFF',
                    soft: '#FFFFFF',
                    dark: '#E5E7EB',
                },
                pearl: '#FFFFFF',
                charcoal: {
                    DEFAULT: '#1F2937',
                    muted: '#4B5563',
                },
                input: "#E5E7EB",
                ring: "#C2255C",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
