import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'dm-serif': ['DM Serif Text', 'serif'],
				'poiret': ['Poiret One', 'sans-serif'],
				'poppins': ['Poppins', 'sans-serif'],
				'montserrat': ['Montserrat', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-nature': 'var(--gradient-nature)',
				'gradient-earth': 'var(--gradient-earth)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-hero-overlay': 'var(--gradient-hero-overlay)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-modern': 'var(--gradient-modern)'
			},
			boxShadow: {
				'organic': 'var(--shadow-organic)',
				'elevated': 'var(--shadow-elevated)',
				'glass': 'var(--shadow-glass)'
				// 'glass': 'var(--shadow-glass)',
				// 'glass-auth': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
			},
			backdropBlur: {
				'glass': 'var(--backdrop-blur)'
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
					// hover: 'hsl(var(--primary-hover))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				nature: {
					DEFAULT: 'hsl(var(--nature))',
					light: 'hsl(var(--nature-light))'
				},
				earth: {
					DEFAULT: 'hsl(var(--earth))',
					light: 'hsl(var(--earth-light))'
				},
				category: {
					hover: 'hsl(var(--category-hover))'
				},
				hero: {
					bg: 'hsl(var(--hero-bg))',
					overlay: 'hsl(var(--hero-overlay))'
				},
				// 'text-link': 'hsl(var(--text-link))',
				// 'text-muted': 'hsl(var(--text-muted))',
				// 'surface-glass': 'var(--surface-glass)',
				// 'border-glow': 'var(--border-glow)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'marquee': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-100%)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'marquee': 'marquee 60s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
