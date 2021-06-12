<script>
    import { page } from '$app/stores'
    import { scrollTo } from 'svelte-scrolling'

    export let styles, item_styles = "", link_styles = "", isMobile = false
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
        <a class="{link_styles}" use:scrollTo={'services'} href="/#services">Services</a>
        {:else}
        {#if isMobile}<slot name="services"></slot>{/if}
        <a class="{link_styles}" href="/#services">Services</a>
        {/if}
    </li>
    <li class="list-none {item_styles}">
        {#if $page.path === '/'}
        {#if isMobile}<slot name="projets"></slot>{/if}
        <a class="{link_styles}" use:scrollTo={'projets'} href="/#projets">Projets</a>
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