<script lang="ts">
	import Nav from '$lib/ui/Nav.svelte';
	import ScheduleGrid from '$lib/ui/ScheduleGrid/ScheduleGrid.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	$inspect('on page', data.reservations);
</script>

<svelte:head>
	<title>Waterhouse RSVP</title>
</svelte:head>

<div class="flex h-[100svh] flex-col">
	<Nav />
	<div class="container mx-auto mt-2 h-[calc(100svh-80px)]">
		<ScheduleGrid reservations={data?.reservations} />
	</div>
</div>
