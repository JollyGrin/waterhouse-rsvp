<script lang="ts">
	import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import '../app.css';
	import { ClerkProvider } from 'svelte-clerk';

	let { children } = $props();
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
	{@render children()}
</ClerkProvider>
