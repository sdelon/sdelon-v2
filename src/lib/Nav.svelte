<script>
    import logoSD from '../../static/assets/logo-sd-bleu.png'
    let openMenu = false
</script>


<header class="relative bg-gray-bg">
    <div class="container">
      <nav class="flex justify-between items-center py-6 md:justify-start md:space-x-10">
        <div class="flex justify-start lg:w-0 lg:flex-1 relative z-20">
          <a href="/">
            <span class="sr-only">Stéphanie Delon</span>
            <img class="h-8 w-auto sm:h-10" src={logoSD} alt="">
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
        <ul class="hidden md:flex space-x-10">
            <li class="list-none">
                <a sveltekit:prefetch href="/" class="text-base font-medium text-bleu-dark hover:text-gray-900">Accueil</a>
            </li>
            <li class="list-none">
                <a href="/#services" class="text-base font-medium text-bleu-dark hover:text-gray-900">Services</a>
            </li>
            <li class="list-none">
                <a href="/#projets" class="text-base font-medium text-bleu-dark hover:text-gray-900">Projets</a>
            </li>
            <li class="list-none">
                <a sveltekit:prefetch href="/photographies" class="text-base font-medium text-bleu-dark hover:text-gray-900">Photographies</a>
            </li>
        </ul>
        <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            <a sveltekit:prefetch href="/contact" class="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-gray-bg bg-bleu-dark hover:bg-indigo-700">
            Contact
            </a>
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
          <nav class="mt-6">
            <ul class="grid gap-y-8">
                <li class="list-none">
                    <a sveltekit:prefetch href="/" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                        <!-- Heroicon name: outline/chart-bar -->
                        <svg class="flex-shrink-0 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span class="ml-3 text-base font-medium text-gray-900">
                          Accueil
                        </span>
                      </a>
                </li>
                <li class="list-none">
                    <a href="/#services" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                        <!-- Heroicon name: outline/chart-bar -->
                        <svg class="flex-shrink-0 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span class="ml-3 text-base font-medium text-gray-900">
                          Services
                        </span>
                      </a>
                </li>
                <li class="list-none">
                    <a href="/#projets" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                        <!-- Heroicon name: outline/chart-bar -->
                        <svg class="flex-shrink-0 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span class="ml-3 text-base font-medium text-gray-900">
                          Projets
                        </span>
                      </a>
                </li>
                <li class="list-none">
                    <a sveltekit:prefetch href="/photographies" class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50">
                        <!-- Heroicon name: outline/chart-bar -->
                        <svg class="flex-shrink-0 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span class="ml-3 text-base font-medium text-gray-900">
                          Photographies
                        </span>
                      </a>
                </li>
            </ul>
        </nav>
        </div>
        <div class="py-6 px-5 space-y-6">
          <div>
            <a sveltekit:prefetch href="/contact" class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-gray-bg bg-bleu-dark hover:bg-bleu-lighter">
              Contact
            </a>
          </div>
        </div>
        </div>
    </div>
    {/if}
</header>