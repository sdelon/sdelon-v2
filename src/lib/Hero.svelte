<script>
    import { extractMotUnderline } from '../utils/helpers'
    import PrismicDom from 'prismic-dom'
    import CTALink from '$lib/UI/CTALink.svelte'

    export let accueil
</script>

<div class="relative flex flex-wrap items-center justify-center text-center -mx-2">
    <div class="absolute -top-20 left-0 z-10 opacity-30">
        <img src="assets/vector-hero.svg" alt="">
    </div>
    <div class="lg:w-2/3 px-2 lg:pr-10 mt-20 order-1 lg:order-none relative z-20">
      <p class="text-gray-light uppercase text-sm tracking-wide pb-3">{PrismicDom.RichText.asText(accueil.data.sous_titre)}</p>
      <div class="relative">
          <h1 class="text-3xl sm:text-5xl font-black text-gray-800 max-w-3xl mx-auto">{extractMotUnderline(accueil.data.titre_principal[0].text, accueil.data.mot_underline)} <span class="relative">
              {accueil.data.mot_underline}
              <div class="absolute -bottom-9 sm:-bottom-7 right-3 sm:right-0 -mr-10">
                  <svg class="svg-shadow" width="176" height="78" viewBox="0 0 176 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                  </svg>                    
              </div>
          </span>                 
          </h1>
      </div>
      <div class="lg:w-2/3 mx-auto mt-8 text-gray-light leading-relaxed">{@html PrismicDom.RichText.asHtml(accueil.data.description)}</div>
      <div>
          <CTALink 
          texte={accueil.data.texte_lien_cta}
          isLink={true}
          link="contact"
          spacing='my-12' />
      </div>
    </div>
</div>

