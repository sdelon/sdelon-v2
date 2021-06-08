<script>
    import PrismicDom from 'prismic-dom'
    import Img from '$lib/UI/Img.svelte'

    export let service
</script>

<div>
    <Img src={service.icon.url} alt={service.icon.alt} />
    <h3 class="text-lg font-black text-gray-800 tracking-wide pb-2">{PrismicDom.RichText.asText(service.titre_service)}</h3>
    <p class="text-gray-700 w-11/12">{@html PrismicDom.RichText.asHtml(service.description_service)}</p>
</div>

