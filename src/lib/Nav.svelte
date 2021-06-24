<script>
    import logoSD from '/static/assets/logo-sd-bleu.png'
    import NavList from '$lib/UI/NavList.svelte'
    import CTALink from '$lib/UI/CTALink.svelte'

    let openMenu = false
</script>

<header class="relative bg-gray-bg">
    <div class="container">
      <nav aria-label="navigation principale" class="flex justify-between items-center py-6 md:justify-start md:space-x-10">
        <div class="flex justify-start lg:w-0 lg:flex-1 relative z-20">
          <a href="/">
            <span class="sr-only">Stéphanie Delon</span>
            <img class="h-8 w-auto sm:h-10" src={logoSD} alt="SDelon accueil">
          </a>
        </div>
        {#if openMenu === false}
        <div class="-mr-2 -my-2 md:hidden">
          <button type="button" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" aria-expanded="false">
            <span class="sr-only">Open menu</span>
            <!-- Heroicon name: outline/menu -->
            <svg on:click={() => openMenu = !openMenu} class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/if}
        <NavList styles="hidden md:flex space-x-10 main-nav" />
        <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
          <CTALink isLink={true} link="contact" texte="contact" />
        </div>
      </nav>
    </div>
  
    <!--
      Mobile menu
    -->
    {#if openMenu}
    <div class="absolute bg-gray-bg top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden z-10">
        <div class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
        <div class="pt-5 pb-6 px-5">
          <div class="w-full flex items-center justify-end">
            <button type="button" class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                <span class="sr-only">Close menu</span>
                <!-- Heroicon name: outline/x -->
                <svg on:click={() => openMenu = false} class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
          <nav class="mt-6" aria-label="navigation pour mobile">
            <NavList 
            styles="grid gap-y-8" 
            isMobile 
            item_styles="flex items-center gap-4"
            link_styles="font-medium text-bleu-dark hover:text-bleu-lighter">
              <svg slot="accueil" class="flex-shrink-0 h-6 w-6 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <svg slot="services" class="flex-shrink-0 h-6 w-6 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <svg slot="projets" class="flex-shrink-0 h-6 w-6 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <svg slot="photographies" class="flex-shrink-0 h-6 w-6 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </NavList>
        </nav>
        </div>
        <div class="py-6 px-5 space-y-6">
          <div>
            <CTALink isLink={true} link="contact" texte="contact" />
          </div>
        </div>
        </div>
    </div>
    {/if}
</header>