<script>
  import "../app.postcss"
  import Nav from '$lib/Nav.svelte'
  import Footer from '$lib/Footer.svelte'
</script>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />