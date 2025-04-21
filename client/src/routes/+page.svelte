<script lang="ts">
	import Nav from '$lib/ui/Nav.svelte';
	import ScheduleGrid from '$lib/ui/ScheduleGrid/ScheduleGrid.svelte';
</script>

<svelte:head>
	<title>Waterhouse RSVP</title>
</svelte:head>

<Nav />
<div class="container mx-auto h-[800px]">
	<ScheduleGrid />
</div>
