<script>
    import PrismicDom from 'prismic-dom'
    import CTALink from '$lib/UI/CTALink.svelte'
    export let slice
</script>

<section class="container py-16">
    <div class="text-center">
        <p class="text-gray-600 uppercase tracking-wide">{PrismicDom.RichText.asText(slice.primary.sous_titre1)}</p>
        <h2 class="text-5xl font-black max-w-xl mx-auto pt-4 pb-10">{PrismicDom.RichText.asText(slice.primary.titre_section)}</h2>
        <p class="max-w-xl mx-auto text-lg text-gray-700">{@html PrismicDom.RichText.asHtml(slice.primary.description)}</p>
        <CTALink isLink={true} link="contact" texte={slice.primary.texte_lien_cta1} spacing="my-20" />
        <div class="w-full h-[0.8px] bg-gray-200"></div>
    </div>
</section>