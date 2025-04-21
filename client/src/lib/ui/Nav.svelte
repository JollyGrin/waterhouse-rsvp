<script lang="ts">
	import {
		SignedIn,
		SignedOut,
		SignInButton,
		useClerkContext,
		UserButton,
		UserProfile
	} from 'svelte-clerk/client';
	const clerk = useClerkContext();
	const userId = $derived(clerk.auth.userId);
	const userName = $derived(clerk.user?.username ?? clerk.user?.fullName);
	$inspect(clerk);
</script>

<header class="flex flex-col-reverse items-center justify-between gap-4 p-4 md:flex-row">
	<p class="font-jersey hidden text-4xl md:inline">waterhouse</p>
	<div class="flex items-center gap-4 text-xl font-bold select-none">
		<span> RSVP </span>
		<span class="opacity-50"> My Reservations </span>
	</div>
	<SignedOut>
		<SignInButton />
	</SignedOut>
	<SignedIn>
		<div class="flex items-center gap-2">
			<span class="bg-brand-dark rounded-full px-4 py-1">Credits: 10</span>
			<p class="text-xl font-bold">{userName}</p>
			<UserButton />
		</div>
	</SignedIn>
</header>
