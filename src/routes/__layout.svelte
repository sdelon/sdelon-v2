<script>
    import "../app.postcss"
    import { onMount } from 'svelte'
    import Nav from '$lib/Nav.svelte'
    import Footer from '$lib/Footer.svelte'

    onMount(() => {
      import('https://unpkg.com/agnostic-axe@3').then(({ AxeObserver, logViolations }) => {
        const MyAxeObserver = new AxeObserver(logViolations)
        MyAxeObserver.observe(document)
      })
    })
</script>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />