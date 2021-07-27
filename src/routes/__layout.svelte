<script>
  import "../app.postcss"
  import Nav from '$lib/Nav.svelte'
  import Footer from '$lib/Footer.svelte'
</script>

<svelte:head>
  <script src="https://cdn.jsdelivr.net/gh/manucaralmo/GlowCookies@3.1.3/src/glowCookies.min.js"></script>
  <script>
      glowCookies.start('fr', { 
          style: 1,
          analytics: 'G-TMX3F24LXV', 
          policyLink: 'https://policies.google.com/technologies/cookies?hl=fr-FR',
          hideAfterClick: true,
          acceptBtnBackground: '#0C3E3B',
          rejectBtnBackground: '#F3F3F3'
      });
  </script>
</svelte:head>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />