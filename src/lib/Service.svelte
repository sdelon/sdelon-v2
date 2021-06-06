<script>
    import Img from '$lib/UI/Img.svelte'

    export let service
</script>

<div>
    <Img src={service.icon.src} alt={service.icon.alt} />
    <h3 class="text-lg font-black text-gray-800 tracking-wide pb-2">{service.titre}</h3>
    <p class="text-gray-700 w-11/12">{service.texte}</p>
</div>

