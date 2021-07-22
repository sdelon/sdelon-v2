<script>
    import PrismicDom from 'prismic-dom'
    import Img from '$lib/UI/Img.svelte'
    import CTALink from '$lib/UI/CTALink.svelte'
    export let slice
</script>

<section class="py-8 px-4">
  <div class="flex flex-wrap items-center max-w-7xl mx-auto">
    <div class="md:w-1/2 px-4 mb-8 md:mb-0">
        <div class="flex-grow w-auto h-auto">
            <Img
              src={slice.primary.image.url}
              mq_sizes="(min-width: 760px) 50vw, 100vw"
              alt="Je suis sur une plage à quelques kilomètres de mon domicile"
              width={slice.primary.image.dimensions.width}
              height={slice.primary.image.dimensions.height}
              styles="rounded shadow" />
        </div>
    </div>
    <div class="md:w-1/2 px-4 md:pl-20">
      <p class="text-gray-600 uppercase tracking-wide text-sm font-semibold pb-8">{PrismicDom.RichText.asText(slice.primary.sous_titre1)}</p>
      <h2 class="text-4xl md:pl-8 md:border-l-8 md:border-bleu-dark font-black font-heading">{PrismicDom.RichText.asText(slice.primary.titre_section)}</h2>
      <div class="mt-6 mb-8 text-gray-light leading-relaxed">{@html PrismicDom.RichText.asHtml(slice.primary.description)}</div>
      <CTALink isLink={true} link="contact/#formulaire" texte={slice.primary.texte_lien_cta1} spacing="my-2" />
    </div>
  </div>
</section>