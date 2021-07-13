<script>
    import { fly } from 'svelte/transition'
    import PrismicDom from 'prismic-dom'
    import Img from '$lib/UI/Img.svelte'
    import Modal from '$lib/UI/Modal.svelte'
    import LoadingSpinner from '$lib/UI/LoadingSpinner.svelte'

    export let slice, isImgRight = false
    let hovering = false, isModalClicked = false
    let loader

    const updateLoaded = () => loader.classList.add('hidden')
</script>

{#if isModalClicked}
<Modal titre_projet={PrismicDom.RichText.asText(slice.titre_projet)}>
    <div>
        <div class="bg-gray-200 flex justify-between items-center sm:p-12">
            <p class="text-5xl font-black text-gray-800">{PrismicDom.RichText.asText(slice.titre_projet)}</p>
            <svg on:click={() => isModalClicked = !isModalClicked} class="w-10 h-10 cursor-pointer text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="relative w-full h-96">
            <div bind:this={loader} class="bg-gray-200 absolute flex justify-center items-center inset-0 z-20">
                <LoadingSpinner />
            </div>
            <iframe on:load={updateLoaded} src={slice.lien_projet.url} class="w-full h-96" title={PrismicDom.RichText.asText(slice.titre_projet)}></iframe>
        </div>
        <div class="bg-gray-200 w-full h-12"></div>
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
    <div class="bg-gray-200 p-5 sm:p-20 relative">
        <button
        on:mouseenter={() => hovering = true}
        on:mouseleave={() => hovering = false}
        on:click={() => isModalClicked = !isModalClicked}
        class="absolute top-5 right-5 rounded-full border-2 border-gray-800 w-16 h-16 uppercase font-light text-sm text-gray-800 tracking-wide hover:bg-opacity-25">
            {#key hovering}
            {#if hovering}
                <svg in:fly="{{ x: -15, duration: 1000 }}" class="w-8 h-8 text-gray-800 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            {:else}
                <span in:fly="{{ x: 200, duration: 1000 }}">Voir</span>
            {/if}
            {/key}
        </button>
        <div class="leading-loose h-full flex justify-center items-center mt-8 sm:mt-0">
            <div>
                <h3 class="font-black text-gray-800 sm:text-6xl pb-1">{PrismicDom.RichText.asText(slice.titre_projet)}</h3>
                <h4 class="uppercase font-light text-gray-600 tracking-wide pb-6">{PrismicDom.RichText.asText(slice.categories_projet)}</h4>
                <div class="text-gray-800">{@html PrismicDom.RichText.asHtml(slice.description_projet)}</div>
                <a class="relative uppercase font-bold hover:font-black text-gray-600 tracking-widest text-sm inline-block mt-10 mb-8 sm:mb-0" href="{slice.lien_projet.url}" target="blank">Découvrir le projet en ligne
                    <svg class="absolute top-3 right-2 sm:-right-3 drop-shadow-lg" width="84" height="29" viewBox="0 0 84 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.66653 17.8419C10.2741 20.164 28.0441 24.0206 46.2638 20.8697C69.0385 16.9312 75.1828 12.1579 80.507 8.71565" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                    </svg>                   
                </a>
            </div>
        </div>
    </div>
</Modal>
{/if}