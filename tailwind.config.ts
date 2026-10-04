import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: {
                    50: '#fdfbf7',
                    100: '#fbf7ee',
                    200: '#f3ebd6',
                    300: '#e5d8b8',
                    700: '#5a4f3b',
                    800: '#423b2c',
                    900: '#2b261b',
                },
                watercolor: {
                    ink: '#27292d',
                    terracotta: '#e06d53',
                    brick: '#c14937',
                    sage: '#6f9d85',
                    green: '#407958',
                    water: '#8bb8cf',
                    sand: '#e8dcba',
                    mustard: '#f4c568',
                    navy: '#2d3748',
                }
            },
            boxShadow: {
                stamp: '0 4px 14px rgba(45, 35, 20, 0.16)',
                card: '0 6px 20px rgba(50, 40, 25, 0.10), 0 1px 3px rgba(50, 40, 25, 0.06)',
                float: '0 10px 30px -5px rgba(40, 30, 15, 0.22)',
            }
        },
    },
    plugins: [],
};

export default config;