<script>
    export let styles, item_styles = "", link_styles = "", isMobile = false
</script>

<style>
    .main-nav > li > a {
      @apply text-lg font-medium text-bleu-dark hover:text-bleu-lighter;
    }
</style>


<ul class="{styles}">
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="accueil"></slot>{/if}
        <a class="{link_styles}" sveltekit:prefetch href="/">Accueil</a>
    </li>
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="services"></slot>{/if}
        <a class="{link_styles}" href="/#services">Services</a>
    </li>
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="projets"></slot>{/if}
        <a class="{link_styles}" href="/#projets">Projets</a>
    </li>
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="tarifs" ></slot>{/if}
        <a class="{link_styles}" sveltekit:prefetch href="/tarifs">Tarifs</a>
    </li>
    <li class="list-none {item_styles}">
        {#if isMobile}<slot name="photographies" ></slot>{/if}
        <a class="{link_styles}" sveltekit:prefetch href="/photographies">Photographies</a>
    </li>
</ul>