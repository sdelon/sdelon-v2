<script context="module">
  import Client from '../utils/client'
  import Prismic from '@prismicio/client'
  export const prerender = true
  
  export async function load() {
    const photographies = await Client.query(
        [Prismic.Predicates.at('document.type', 'photographies')]
    )

    return {
      props: {
        photographies: photographies.results[0]
      }
    }
  }
</script>

<script>
  import SEOHead from '$lib/SEOHead.svelte'
  import Img from '$lib/UI/Img.svelte'
  import CTA from '$lib/CTA.svelte'
  export let photographies
</script>

<SEOHead
	title="Photographies | Stéphanie Delon"
	description="Développeuse web et graphiste située dans le Cap Sizun en Finistère, je suis également passionnée par la photographie | Stéphanie Delon"
	image="https://images.prismic.io/sdelon-portfolio/1a2052cd-b1cd-4e96-bb47-9938c0ca6b69_falaise.jpg?auto=compress,format"
	alt="Côte Nord du Cap Sizun" />

<section class="pt-20">
  <div class="container px-4 mx-auto">
    <div class="mb-12 flex flex-wrap items-end justify-between">
      <div class="w-full md:w-auto mb-4 md:mb-0">
        <h2 class="mt-2 text-4xl lg:text-5xl font-bold font-heading text-gray-800">Le Cap Sizun en 
          <span class="relative">
          photos
          <div class="svg-shadow absolute -bottom-7 -right-8">
            <svg width="176" height="78" viewBox="0 0 176 78" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
              </svg>
          </div>
        </span>
      </h2>
        <p class="text-gray-600 max-w-md pt-4">La photographie est une de mes passions depuis de nombreuses années et comment ne pas être inspirée par la beauté époustouflante et sauvage du Cap Sizun !</p>
      </div>
    </div>
    {#each photographies.data.body as slice}
    <div class="flex flex-wrap -mx-4">
      {#if slice.slice_type === 'gallerie'}
      <section class="container py-12 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="rounded-lg lg:col-span-3 row-span-2">
          <Img
          src={slice.items[0].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[0].image.alt}
          width={slice.items[0].image.dimensions.width}
          height={slice.items[0].image.dimensions.height}
          container_styles="h-full"
          styles="w-full h-full object-cover rounded-lg" />
        </div>
        <Img
          src={slice.items[1].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[1].image.alt}
          width={slice.items[1].image.dimensions.width}
          height={slice.items[1].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[2].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[2].image.alt}
          width={slice.items[2].image.dimensions.width}
          height={slice.items[2].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[3].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[3].image.alt}
          width={slice.items[3].image.dimensions.width}
          height={slice.items[3].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[4].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[4].image.alt}
          width={slice.items[4].image.dimensions.width}
          height={slice.items[4].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[5].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[5].image.alt}
          width={slice.items[5].image.dimensions.width}
          height={slice.items[5].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[6].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[6].image.alt}
          width={slice.items[6].image.dimensions.width}
          height={slice.items[6].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[7].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[7].image.alt}
          width={slice.items[7].image.dimensions.width}
          height={slice.items[7].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[8].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[8].image.alt}
          width={slice.items[8].image.dimensions.width}
          height={slice.items[8].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <Img
          src={slice.items[9].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[9].image.alt}
          width={slice.items[9].image.dimensions.width}
          height={slice.items[9].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <div class="md:row-span-2">
          <Img
          src={slice.items[10].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[10].image.alt}
          width={slice.items[10].image.dimensions.width}
          height={slice.items[10].image.dimensions.height}
          container_styles="h-full"
          styles="w-full h-full object-cover rounded-lg" />
        </div>
        <div class="md:col-span-2">
          <Img
          src={slice.items[11].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[11].image.alt}
          width={slice.items[11].image.dimensions.width}
          height={slice.items[11].image.dimensions.height}
          container_styles="h-full"
          styles="w-full h-full object-cover rounded-lg" />
        </div>
        <div class="md:col-span-2">
          <Img
          src={slice.items[12].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[12].image.alt}
          width={slice.items[12].image.dimensions.width}
          height={slice.items[12].image.dimensions.height}
          container_styles="h-full"
          styles="w-full h-full object-cover rounded-lg" />
        </div>
        <Img
          src={slice.items[13].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[13].image.alt}
          width={slice.items[13].image.dimensions.width}
          height={slice.items[13].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        <div class="md:col-span-3 lg:col-span-2">
          <Img
          src={slice.items[14].image.url}
          mq_sizes="(min-width: 760px) 25vw, 100vw"
          alt={slice.items[14].image.alt}
          width={slice.items[14].image.dimensions.width}
          height={slice.items[14].image.dimensions.height}
          styles="w-full h-full object-cover rounded-lg" />
        </div>
      </section>
      {/if}
    </div>
    {#if slice.slice_type === 'cta'}
    <CTA {slice} />
    {/if}
    {/each}
  </div>
</section>