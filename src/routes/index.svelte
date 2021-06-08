<script context="module">
    export async function load({ fetch }) {
        const { accueil } = await fetch('/api').then(res => res.json())
        
        return {
            props: {
                accueil: accueil[0]
            }
        }
    }
</script>

<script>
    import PrismicDom from 'prismic-dom'
    import CTALink from '$lib/UI/CTALink.svelte'
    import Img from '$lib/UI/Img.svelte'
    import Service from '$lib/Service.svelte'
    import Projet from '$lib/Projet.svelte'
    import Testimonials from '$lib/Testimonials.svelte'
    import CTA from '$lib/CTA.svelte'

    export let accueil

    const extractMotUnderline = (str, mot) => {
        let newStr = str
        .split(' ')
        .filter(word => word !== mot)
        .join(' ')

        return newStr
    }
</script>

<section class="container py-16">
    <div class="w-full text-center">
        <p class="text-gray-600 uppercase text-sm tracking-wide pb-3">{PrismicDom.RichText.asText(accueil.data.sous_titre)}</p>
        <div class="relative">
            <h1 class="text-5xl font-black text-gray-800 max-w-2xl mx-auto">{extractMotUnderline(accueil.data.titre_principal[0].text, accueil.data.mot_underline)} <span class="relative">
                {accueil.data.mot_underline}
                <div class="absolute -bottom-10 right-0 -mr-10">
                    <svg class="svg-shadow" width="176" height="78" viewBox="0 0 176 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                    </svg>                    
                </div>
            </span>                 
            </h1>
        </div>
        <CTALink 
        texte={accueil.data.texte_lien_cta}
        isLink={true}
        link="contact"
        spacing='my-20' />
    </div>
    <div class="w-full relative">
        <Img 
        src="/static/assets/illu_intro.png" 
        alt=""
        styles="md:w-1/2 mx-auto relative z-10"/>
        <Img
        src="/static/assets/Circle-bg-yellow.png"
        alt=""
        styles="absolute bottom-10 inset-x-0" />
    </div>
</section>
{#each accueil.data.body as slice}
    {#if slice.slice_type === 'services'}
<section id="services" class="container py-16">
        <div>
            <h2 class="text-4xl font-bold text-gray-800 max-w-2xl pb-20">{extractMotUnderline(slice.primary.titre_section[0].text, slice.primary.mot_underline1)} <span class="relative">
                {slice.primary.mot_underline1}
                <div class="absolute -bottom-5 right-0 -mr-10">
                    <svg class="svg-shadow" width="126" height="21" viewBox="0 0 126 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 17.5C25.3333 10.1666 79.7 -2.30002 122.5 6.49998" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                    </svg>                  
                </div>
            </span>
            </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {#each slice.items as service}
                <Service {service} />
            {/each}
        </div>
</section>
    {/if}
    {#if slice.slice_type === 'projets'}
<section id="projets" class="container py-16">
        <div>
            <h2 class="text-4xl font-bold text-gray-800 max-w-2xl pb-20">Zoom sur les 
                <span class="relative">
                    projets
                    <div class="hidden sm:block absolute -bottom-5 right-0">
                        <svg class="svg-shadow" width="176" height="28" viewBox="0 0 176 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 24.5C61.3333 25.5 176.1 22.6 172.5 3" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                        </svg>                 
                    </div>
                </span> 
            récemment mis en ligne
            </h2>
        </div>
        <div class="flex flex-col gap-32 lg:gap-48">
            {#each slice.items as slice, i}
                <Projet {slice} isImgRight={i % 2 === 0 ? false : true }/>
            {/each}
        </div>
</section>
    {/if}
    {#if slice.slice_type === 'temoignages'}
<Testimonials {slice} />
    {/if}
    {#if slice.slice_type === 'cta'}
<CTA {slice} />
    {/if}
{/each}