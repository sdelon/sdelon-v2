<script>
    import CTALink from '$lib/UI/CTALink.svelte'
</script>

<section class="container py-16">
    <div class="text-center">
        <p class="text-gray-600 uppercase tracking-wide">Soyez visible . Touchez plus de monde . Développez votre activité</p>
        <h2 class="text-5xl font-black max-w-xl mx-auto pt-4 pb-10">Et si nous discutions de votre projet ?</h2>
        <p class="max-w-xl mx-auto text-lg text-gray-700">Vous avez une question ou vous souhaitez me parler de votre projet? Envoyez-moi un message et nous trouverons ensemble une solution adaptée à vos besoins.</p>
        <CTALink isLink={true} link="contact" texte="contact" spacing="my-20" />
        <div class="w-full h-[0.8px] bg-gray-200"></div>
    </div>
</section>