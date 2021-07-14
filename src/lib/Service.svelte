<script>
    import PrismicDom from 'prismic-dom'

    export let service
</script>

<div>
    <img src={service.icon.url} alt={service.icon.alt} width={service.icon.dimensions.width} height={service.icon.dimensions.height} />
    <h3 class="text-lg font-black text-gray-800 tracking-wide pb-2">{PrismicDom.RichText.asText(service.titre_service)}</h3>
    <p class="text-gray-700 w-11/12">{@html PrismicDom.RichText.asHtml(service.description_service)}</p>
</div>

