<script>
  import "../app.postcss"
  import Nav from '$lib/Nav.svelte'
  import Footer from '$lib/Footer.svelte'

</script>

<svelte:head>
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N97DMSN');
</script>
<script type="text/javascript">
  (adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
  (_axcb = window._axcb || []).push(function(sdk) {
    sdk.on('cookies:complete', function(choices) {
      if (!choices['Google Ads']) {   
          window.adsbygoogle.requestNonPersonalizedAds = 1;
      }
      window.adsbygoogle.pauseAdRequests = 0;
    });
  });
  </script>
</svelte:head>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />