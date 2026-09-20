/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Cormorant Garamond', 'serif'],
                body: ['Mulish', 'sans-serif'],
                accent: ['Montserrat', 'sans-serif'],
            },
            colors: {
                rose: {
                    DEFAULT: '#AE5A66',
                    hover: '#97495A',
                    light: '#F6E4E6',
                    tint: '#F6E4E6',
                    dark: '#97495A',
                    decorative: '#C87D87',
                    50: '#F6E4E6',
                    100: '#F6E4E6',
                    500: '#AE5A66',
                    600: '#97495A',
                    700: '#833B4B',
                },
                blush: {
                    DEFAULT: '#C87D87',
                    light: '#F6E4E6',
                    tint: '#F6E4E6',
                    dark: '#AE5A66',
                },
                gold: {
                    DEFAULT: '#C9A961',
                    light: '#E5D6AD',
                    dark: '#8E6F2C',
                    text: '#8E6F2C',
                },
                serenity: {
                    DEFAULT: '#AE5A66',
                    light: '#F6E4E6',
                    dark: '#97495A',
                },
                ivory: {
                    DEFAULT: '#FFFBF7',
                    soft: '#FAF0EA',
                    warm: '#FAF0EA',
                    light: '#FFFFFF',
                },
                pearl: '#FAF0EA',
                charcoal: {
                    DEFAULT: '#2D2420',
                    muted: '#6B5B55',
                },
                border: "#EADFD6",
                input: "#EADFD6",
                ring: "#AE5A66",
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
