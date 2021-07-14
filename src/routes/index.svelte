<script context="module">
    import Client from '../utils/client'
    import Prismic from '@prismicio/client'
    export const prerender = true
    
    export async function load() {
        const accueil = await Client.query(
            [Prismic.Predicates.at('document.type', 'accueil')]
        )

        return {
            props: {
                accueil: accueil.results[0]
            }
        }
    }
</script>

<script>
    import { extractMotUnderline } from '../utils/helpers'
    import SEOHead from '$lib/SEOHead.svelte'
    import Hero from '$lib/Hero.svelte'
    import Service from '$lib/Service.svelte'
    import Projet from '$lib/Projet.svelte'
    import Testimonials from '$lib/Testimonials.svelte'
    import CTA from '$lib/CTA.svelte'

    export let accueil
</script>

<style>
    .projet-spacing {
        @apply gap-32;
    }
</style>

<SEOHead
	title="Accueil | Stéphanie Delon"
	description="Développeuse web et graphiste située dans le Cap Sizun en Finistère, découvrez ici les services que je vous propose ainsi que mes plus récents projets | Stéphanie Delon"
	image=""
	alt="" />

<section class="container pb-8">
    <Hero {accueil} />
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
        <div class="flex flex-col projet-spacing">
            {#each slice.items as slice, i}
                <Projet {slice} isImgRight={i % 2 === 0 ? false : true } />
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