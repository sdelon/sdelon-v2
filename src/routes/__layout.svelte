<script>
  import "../app.postcss"
  import Nav from '$lib/Nav.svelte'
  import Footer from '$lib/Footer.svelte'
  import CookieConsent from '$lib/CookieConsent.svelte'

	let choices = {
		tracking: false,
		marketing: false
	}
	let color_primary = "#0D3E3A"
	let color_secondary = "#F6F7F9"

  function analytics() {
    alert('analytics is now working')
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  
    gtag('config', 'G-TMX3F24LXV');
  }
</script>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />
<CookieConsent 
{color_primary} 
{color_secondary} 
cookieName="sdelon_cookie_consent" 
description="En autorisant l'utilisation des cookies - petit fichier texte déposé sur votre ordinateur lors de votre visite sur le site - vous acceptez le dépôt et la lecture de cookies et l'utilisation de technologies de suivi nécessaires à leur bon fonctionnement." 
{choices} />