const colors = require('tailwindcss/colors')

module.exports = {
	mode: "jit",
	purge: [
		"./src/**/*.{html,js,svelte,ts}",
	],
	theme: {
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			gray: colors.warmGray,
			'bleu-dark': '#0C3E3B',
			'bleu-lighter': '#0F6F6A',
			'yellow': '#F9F871',
			'testimonials-bg': '#ECEFEF',
			'gray-bg': '#F7F7F8',
			'yellow-light': '#FAF1D8'
		},
		extend: {
			fontFamily: {
				sans : ['Inter', 'system-ui', '-apple-system', 'sans-serif']
			},
			dropShadow: ['group-hover']
		}
	},
	plugins: [],
};
