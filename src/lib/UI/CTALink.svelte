<script>
    export let texte, anchor, link, isLink = false, spacing
</script>


<a sveltekit:prefetch href={isLink ? `/${link}` : `/#${anchor}`} class="{spacing} text-lg font-medium hover:bg-bleu-lighter inline-block bg-bleu-dark px-10 py-2 rounded-lg text-gray-bg transition duration-300">{texte}</a>
