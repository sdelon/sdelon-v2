<script>
  import "../app.postcss"
  import Nav from '$lib/Nav.svelte'
  import Footer from '$lib/Footer.svelte'

</script>

<svelte:head>
  <script>
      window.axeptioSettings = {
        clientId: "6139c090defe3c3e027781ae",
      };
      
      (function(d, s) {
        var t = d.getElementsByTagName(s)[0], e = d.createElement(s);
        e.async = true; e.src = "//static.axept.io/sdk.js";
        t.parentNode.insertBefore(e, t);
      })(document, "script");
    
    function launchGA(){
      var el = document.createElement('script');
      el.setAttribute('type', 'text/javascript');
      el.setAttribute('async', true);
      el.setAttribute('src', '//www.googletagmanager.com/gtag/js?id=G-TMX3F24LXV');
      document.body.append(el); window.dataLayer = window.dataLayer || [];

      function gtag(){ dataLayer.push(arguments); }
      
      gtag('js', new Date());
      gtag('config', 'UA-234217-21', { 'anonymize_ip': true });
      gtag('config', 'UA-234217-21', {'link_attribution': true});
    }
    // La fonction qui relie Axeptio au lancement du cookie Google Analytics
    void 0 === window._axcb && (window._axcb = []);
    window._axcb.push(function(axeptio) {
        axeptio.on("cookies:complete", function(choices) {
        if(choices.google_analytics) {
          launchGA();
          }
        });
    });
    </script>
</svelte:head>

<Nav />
<main class="bg-gray-bg min-h-screen">
    <slot />
</main>
<Footer />