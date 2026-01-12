const defaultTheme = require('tailwindcss/defaultTheme')

const svgToDataUri = require('mini-svg-data-uri')
const plugin = require('tailwindcss/plugin')

const colors = require('tailwindcss/colors')
const {default: flattenColorPalette} = require('tailwindcss/lib/util/flattenColorPalette')

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,tsx,jsx}'],
    theme: {
        extend: {
            animation: {
                first: 'moveVertical 30s linear infinite',
                second: 'moveInCircle 20s reverse linear infinite',
                third: 'moveInCircle 40s linear infinite',
                fourth: 'moveHorizontal 40s linear infinite',
                fifth: 'moveInCircle 20s linear infinite',
                'meteor-effect': 'meteor 20s linear infinite',
                shimmer: 'shimmer 2s linear infinite',
                spinCubic: 'spinCustom 2s cubic-bezier(0.7, 0.11, 0.28, 0.89) infinite',
            },
            keyframes: {
                shimmer: {
                    from: {
                        backgroundPosition: '0 0'
                    },
                    to: {
                        backgroundPosition: '-200% 0'
                    }
                },
                meteor: {
                    '0%': {transform: 'rotate(215deg) translateX(0)', opacity: 1},
                    '70%': {opacity: 1},
                    '90%': {opacity: 0.9},
                    '100%': {
                        transform: 'rotate(215deg) translateX(-1500px)',
                        opacity: 0
                    }
                },
                moveHorizontal: {
                    '0%': {
                        transform: 'translateX(-50%) translateY(-10%)'
                    },
                    '50%': {
                        transform: 'translateX(50%) translateY(10%)'
                    },
                    '100%': {
                        transform: 'translateX(-50%) translateY(-10%)'
                    }
                },
                moveInCircle: {
                    '0%': {
                        transform: 'rotate(0deg)'
                    },
                    '50%': {
                        transform: 'rotate(180deg)'
                    },
                    '100%': {
                        transform: 'rotate(360deg)'
                    }
                },
                moveVertical: {
                    '0%': {
                        transform: 'translateY(-50%)'
                    },
                    '50%': {
                        transform: 'translateY(50%)'
                    },
                    '100%': {
                        transform: 'translateY(-50%)'
                    }
                },
                spinCustom: {
                    '0%': {transform: 'rotate(0deg)'},
                    '100%': {transform: 'rotate(720deg)'}
                }
            },
            fontFamily: {
                sans: ['Uncut Sans Regular']
            },
            height: {
                '10v': '10vh',
                '15v': '15vh',
                '20v': '20vh',
                '25v': '25vh',
                '30v': '30vh',
                '35v': '35vh',
                '40v': '40vh',
                '45v': '45vh',
                '50v': '50vh',
                '55v': '55vh',
                '60v': '60vh',
                '65v': '65vh',
                '70v': '70vh',
                '75v': '75vh',
                '80v': '80vh',
                '85v': '85vh',
                '90v': '90vh',
                '95v': '95vh',
                '100v': '100vh'
            },
            width: {
                '1/8': '12.5%',
                '2/8': '25%',
                '3/8': '37.5%',
                '4/8': '50%',
                '5/8': '62.5%',
                '6/8': '75%',
                '7/8': '87.5%'
            },
            flexBasis: {
                '1/8': '12.5%',
                '2/8': '25%',
                '3/8': '37.5%',
                '4/8': '50%',
                '5/8': '62.5%',
                '6/8': '75%',
                '7/8': '87.5%',

                '1/10': '10%',
                '2/10': '20%',
                '3/10': '30%',
                '4/10': '40%',
                '5/10': '50%',
                '6/10': '60%',
                '7/10': '70%',
                '8/10': '80%',
                '9/10': '90%'
            }
        }
    },
    plugins: [
        plugin(function ({addVariant}) {
            addVariant("amoled", ".amoled &")
        }),
        addVariablesForColors,
        function ({matchUtilities, theme}: any) {
            matchUtilities(
                {
                    'bg-grid': (value: any) => ({
                        backgroundImage: `url("${svgToDataUri(
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
                        )}")`
                    }),
                    'bg-grid-small': (value: any) => ({
                        backgroundImage: `url("${svgToDataUri(
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
                        )}")`
                    }),
                    'bg-dot': (value: any) => ({
                        backgroundImage: `url("${svgToDataUri(
                            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
                        )}")`
                    })
                },
                {values: flattenColorPalette(theme('backgroundColor')), type: 'color'}
            )
        }
    ]
}

function addVariablesForColors({addBase, theme}: any) {
    let allColors = flattenColorPalette(theme('colors'))
    let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]))

    addBase({
        ':root': newVars
    })
}