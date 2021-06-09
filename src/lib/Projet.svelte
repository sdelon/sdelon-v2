<script>
    import PrismicDom from 'prismic-dom'
    import Img from '$lib/UI/Img.svelte'
    import LinkSVG from '$lib/UI/LinkSVG.svelte'

    export let slice, isImgRight = false
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 relative">
    <div class="{isImgRight ? 'md:order-last' : 'order-first'}">
        <Img 
        src={slice.image.url}
        alt={slice.image.alt}
        width={slice.image.dimensions.width}
        height={slice.image.dimensions.height}
        styles="p-5 relative z-10"/>
        <div class="bg-yellow w-1/3 h-1/3 absolute top-0 {isImgRight ? 'md:right-0' : 'left-0'}"></div>
    </div>
    <div class="{isImgRight ? 'text-left place-self-start' : 'md:text-right place-self-end'} lg:w-1/2">
        <h3 class="font-black text-gray-800 text-4xl pb-1">{PrismicDom.RichText.asText(slice.titre_projet)}</h3>
        <h4 class="uppercase text-gray-500 tracking-wide pb-6">{PrismicDom.RichText.asText(slice.categories_projet)}</h4>
        <div class="text-gray-800">{@html PrismicDom.RichText.asText(slice.description_projet)}</div>
        <LinkSVG href='/' position="-bottom-5 {isImgRight ? 'md:left-0 md:-ml-5' : 'md:right-5'}" />
    </div>
</div>