<script lang="ts">
	import * as env from '$env/static/public';
	import { Toaster } from 'svelte-french-toast';
	import '../app.css';
	import { ClerkProvider } from 'svelte-clerk';

	let { children } = $props();
</script>

<Toaster />
<ClerkProvider publishableKey={env?.PUBLIC_CLERK_PUBLISHABLE_KEY}>
	{@render children()}
</ClerkProvider>
