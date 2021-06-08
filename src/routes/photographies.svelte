<script context="module">
  export async function load({ fetch }) {
    const { photographies } = await fetch('/api/photographies').then(res => res.json())

    return {
      props: {
        photographies: photographies[0]
      }
    }
  }
</script>

<script>
  import Img from '$lib/UI/Img.svelte'
  import CTA from '$lib/CTA.svelte'
  export let photographies
</script>

<main class="min-h-screen bg-gray-bg">
  {#each photographies.data.body as slice}
  {#if slice.slice_type === 'gallerie'}
    <section class="container py-20 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="rounded-lg lg:col-span-3 row-span-2">
        <Img
        src={slice.items[0].image.url}
        alt={slice.items[0].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[1].image.url}
        alt={slice.items[1].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[2].image.url}
        alt={slice.items[2].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[3].image.url}
        alt={slice.items[3].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[4].image.url}
        alt={slice.items[4].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[5].image.url}
        alt={slice.items[5].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[6].image.url}
        alt={slice.items[6].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[7].image.url}
        alt={slice.items[7].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[8].image.url}
        alt={slice.items[8].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[9].image.url}
        alt={slice.items[9].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div class="md:row-span-2">
        <Img
        src={slice.items[10].image.url}
        alt={slice.items[10].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div class="md:col-span-2">
        <Img
        src={slice.items[11].image.url}
        alt={slice.items[11].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div class="md:col-span-2">
        <Img
        src={slice.items[12].image.url}
        alt={slice.items[12].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <Img
        src={slice.items[13].image.url}
        alt={slice.items[13].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
      <div class="md:col-span-3 lg:col-span-2">
        <Img
        src={slice.items[14].image.url}
        alt={slice.items[14].image.alt}
        styles="w-full h-full object-cover rounded-lg" />
      </div>
    </section>
  {/if}
  {#if slice.slice_type === 'cta'}
    <CTA {slice} />
  {/if}
  {/each}
</main>