<script>
    import "../app.postcss"
    import Nav from '$lib/Nav.svelte'
    import Footer from '$lib/Footer.svelte'

</script>

<svelte:head>
  <script async src="https://cdn.volument.com/v1/volument.js" onload="volument('74eeb974fd')"></script>
</svelte:head>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />