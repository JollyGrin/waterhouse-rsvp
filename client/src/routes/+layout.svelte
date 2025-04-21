<script lang="ts">
	import env from '$env/static/public';
	import '../app.css';
	import { ClerkProvider } from 'svelte-clerk';

	let { children } = $props();
</script>

<ClerkProvider publishableKey={env?.PUBLIC_CLERK_PUBLISHABLE_KEY}>
	{@render children()}
</ClerkProvider>
