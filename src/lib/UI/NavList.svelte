<script>
    import { page } from '$app/stores'
    import { gsap } from 'gsap'
    import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin.js'

    export let styles, item_styles = "", link_styles = "", isMobile = false
    
    gsap.registerPlugin(ScrollToPlugin)

    const scrollToAnchor = (node, params) => {
    function goToAnchor(e) {
        if(e) e.preventDefault()
            gsap.to(window, { duration: 1, scrollTo: `#${params}`})
        }
        node.addEventListener('click', goToAnchor)
        return {
            onDestroy() {
                node.removeEventListener('click', goToAnchor)
            }
        }
    }
</script>

<style>
    .main-nav > li > a {
      @apply text-base font-medium text-bleu-dark hover:text-bleu-lighter;
    }
</style>


<ul class="{styles}">
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="accueil"></slot>{/if}
        <a class="{link_styles}" sveltekit:prefetch href="/">Accueil</a>
    </li>
    <li class="list-none {item_styles}">
        {#if $page.path === '/'}
        {#if isMobile}<slot name="services"></slot>{/if}
        <a use:scrollToAnchor={'services'} class="{link_styles}" href="/#services">Services</a>
        {:else}
        {#if isMobile}<slot name="services"></slot>{/if}
        <a class="{link_styles}" href="/#services">Services</a>
        {/if}
    </li>
    <li class="list-none {item_styles}">
        {#if $page.path === '/'}
        {#if isMobile}<slot name="projets"></slot>{/if}
        <a use:scrollToAnchor={'projets'} class="{link_styles}" href="/#projets">Projets</a>
        {:else}
        {#if isMobile}<slot name="projets"></slot>{/if}
        <a class="{link_styles}" href="/#projets">Projets</a>
        {/if}
    </li>
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="photographies" ></slot>{/if}
        <a class="{link_styles}" sveltekit:prefetch href="/photographies">Photographies</a>
    </li>
</ul>