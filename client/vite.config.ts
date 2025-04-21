import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	preview: {
		allowedHosts: [
			'localhost',
			'127.0.0.1',
			'0.0.0.0',
			'waterhouse-rsvp-production.up.railway.app'
		]
	}
});
