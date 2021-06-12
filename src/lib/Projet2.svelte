<script>
    import { fly } from 'svelte/transition'
    import PrismicDom from 'prismic-dom'
    import Img from '$lib/UI/Img.svelte'
    import Modal from '$lib/UI/Modal.svelte'

    export let slice, isImgRight = false
    let hovering = false, isModalClicked = false
</script>

{#if isModalClicked}
<Modal titre_projet={PrismicDom.RichText.asText(slice.titre_projet)}>
    <div style="background-color:{slice.bg_color}">
        <div class="flex justify-between items-center p-12">
            <p class="text-5xl font-black text-gray-800">{PrismicDom.RichText.asText(slice.titre_projet)}</p>
            <svg on:click={() => isModalClicked = !isModalClicked} class="w-10 h-10 cursor-pointer text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
            <Img 
            src="/static/assets/Sans titre.png"
            alt="" />
        </div>
    </div>
</Modal>
{:else}
<Modal styles="grid grid-cols-1 md:grid-cols-2 shadow-xl" titre_projet={PrismicDom.RichText.asText(slice.titre_projet)}>
    <div class="{isImgRight ? 'md:order-last' : 'order-first'}">
        <Img 
        src={slice.image.url}
        alt={slice.image.alt}
        width={slice.image.dimensions.width}
        height={slice.image.dimensions.height}
        styles="w-full h-full object-cover"/>
    </div>
    <div style="background-color:{slice.bg_color}" class="p-20 relative">
        <button
        on:mouseenter={() => hovering = true}
        on:mouseleave={() => hovering = false}
        on:click={() => isModalClicked = !isModalClicked}
        class="absolute top-5 right-5 rounded-full border-2 border-gray-800 w-16 h-16 uppercase font-thin text-gray-800 text-xl tracking-wide hover:bg-opacity-25">
            {#key hovering}
            {#if hovering}
                <svg in:fly="{{ x: -15, duration: 1000 }}" class="w-8 h-8 text-gray-800 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            {:else}
                <span in:fly="{{ x: 200, duration: 1000 }}">Voir</span>
            {/if}
            {/key}
        </button>
        <div class="leading-loose h-full flex justify-center items-center">
            <div>
                <h3 class="font-black text-gray-800 text-6xl pb-1">{PrismicDom.RichText.asText(slice.titre_projet)}</h3>
                <h4 class="uppercase text-gray-light tracking-wide pb-6">{PrismicDom.RichText.asText(slice.categories_projet)}</h4>
                <div class="text-gray-800">{@html PrismicDom.RichText.asText(slice.description_projet)}</div>
                <a class="uppercase font-black text-gray-light tracking-widest text-sm inline-block mt-10" href="/">Découvrir le projet en ligne</a>
            </div>
        </div>
    </div>
</Modal>
{/if}
<!-- <div class="grid grid-cols-1 md:grid-cols-2">
    <div class="{isImgRight ? 'md:order-last' : 'order-first'}">
        <Img 
        src={slice.image.url}
        alt={slice.image.alt}
        width={slice.image.dimensions.width}
        height={slice.image.dimensions.height}
        styles="w-full h-full object-cover"/>
    </div>
    <div style="background-color:{slice.bg_color}" class="p-20 relative">
        <button
        on:mouseenter={() => hovering = true}
        on:mouseleave={() => hovering = false}
        on:click={() => isModalClicked = !isModalClicked}
        class="absolute top-5 right-5 rounded-full border-2 border-gray-800 w-16 h-16 uppercase font-thin text-gray-800 text-xl tracking-wide hover:bg-opacity-25">
            {#key hovering}
            {#if hovering}
                <svg in:fly="{{ x: -15, duration: 1000 }}" class="w-8 h-8 text-gray-800 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            {:else}
                <span in:fly="{{ x: 200, duration: 1000 }}">Voir</span>
            {/if}
            {/key}
        </button>
        <div class="leading-loose h-full flex justify-center items-center">
            <div>
                <h3 class="font-black text-gray-800 text-6xl pb-1">{PrismicDom.RichText.asText(slice.titre_projet)}</h3>
                <h4 class="uppercase text-gray-light tracking-wide pb-6">{PrismicDom.RichText.asText(slice.categories_projet)}</h4>
                <div class="text-gray-800">{@html PrismicDom.RichText.asText(slice.description_projet)}</div>
                <a class="uppercase font-black text-gray-light tracking-widest text-sm inline-block mt-10" href="/">Découvrir le projet en ligne</a>
            </div>
        </div>
    </div>
</div> -->