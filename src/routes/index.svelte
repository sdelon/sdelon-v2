<script>
    import CTALink from '$lib/UI/CTALink.svelte'
    import TitleSVG from '$lib/UI/TitleSVG.svelte'
    import Img from '$lib/UI/Img.svelte'
    import Service from '$lib/Service.svelte'
    import Projet from '$lib/Projet.svelte'
    import Testimonials from '$lib/Testimonials.svelte'
    import CTA from '$lib/CTA.svelte'

    let services = [
        {
            id: 1,
            icon: {
                src: '/static/assets/icon-services-1.svg',
                alt: ''
            }, 
            titre: 'Discuter de vos besoins',
            texte: "En me basant sur vos besoins, votre activité, vos objectifs et votre clientèle, je vous propose la création d'une identité visuelle et numérique sur-mesure."
        },
        {
            id: 2,
            icon: {
                src: '/static/assets/icon-services-2.svg',
                alt: ''
            }, 
            titre: 'Design',
            texte: "Un site beau, moderne et performant laisse une bonne impression à l'internaute qui se rappelera de vous."
        },
        {
            id: 3,
            icon: {
                src: '/static/assets/icon-services-3.svg',
                alt: ''
            }, 
            titre: 'Développement',
            texte: "Je propose de vous concevoir un site internet performant pensé et développé en fonction de votre activité qui vous apportera une visibilité numérique indispensable."
        },
        {
            id: 4,
            icon: {
                src: '/static/assets/icon-services-4.svg',
                alt: ''
            }, 
            titre: 'Optimisation et SEO',
            texte: "En respectant les normes en vigueur, votre site sera rapide, performant et optimisé en termes de référencement SEO."
        },
    ]

    let projets = [
        {
            id: 1,
            image: {
                src: '/static/assets/projets/chrysalide.jpg',
                alt: 'Screenshot de la page d\'accueil de patriciadelforge-chrysalide.com'
            },
            titre: 'Chrysalide',
            categories: 'Soins énergétiques . blog',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Condimentum diam orci pretium a pharetra, feugiat cursus. Dictumst risus, sem egestas odio cras adipiscing vulputate. Nisi, risus in suscipit non. Non commodo volutpat, pharetra, vel.',
            url: 'https://patriciadelforge-chrysalide.com/'
        },
        {
            id: 2,
            image: {
                src: '/static/assets/projets/yaeledery-paintings.png',
                alt: 'Screenshot de la page d\'accueil de yaeledery-paintings.com'
            },
            titre: 'Yaeledery',
            categories: 'artiste peintre',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Condimentum diam orci pretium a pharetra, feugiat cursus. Dictumst risus, sem egestas odio cras adipiscing vulputate. Nisi, risus in suscipit non. Non commodo volutpat, pharetra, vel.',
            url: 'https://yaeledery-paintings.com/'
        },
        {
            id: 3,
            image: {
                src: '/static/assets/projets/greenhygge.jpg',
                alt: 'Screenshot de la page d\'accueil de greenhygge.com'
            },
            titre: 'Green Hygge',
            categories: 'artisane . ecommerce',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Condimentum diam orci pretium a pharetra, feugiat cursus. Dictumst risus, sem egestas odio cras adipiscing vulputate. Nisi, risus in suscipit non. Non commodo volutpat, pharetra, vel.',
            url: 'https://greenhygge.com/'
        }
    ]

    let testimonials = [
        {
            id: 1,
            temoignage: 'To quickly start my startup landing page design, I was looking for a landing page UI Kit. Landify is one of the best landing page UI kit I have come across. It’s so flexible, well organised and easily editable.',
            nom: 'Peggy',
            titre: 'Artisane'
        },
        {
            id: 2,
            temoignage: 'I used landify and created a landing page for my startup within a week. The Landify UI Kit is simple and highly intuitive, so anyone can use it. Quickly promote scalable e-commerce rather than cross functional imperatives. Competently incubate state of the art experiences for.',
            nom: 'Patricia',
            titre: 'praticienne en soin énergétique et massages bien-être'
        },
        {
            id: 3,
            temoignage: 'Landify saved our time in designing my company page. Quickly promote scalable e-commerce rather than cross functional imperatives. Competently incubate state of the art experiences for.',
            nom: 'Yael',
            titre: 'Artiste peintre'
        }
    ]
</script>

<section class="container py-16">
    <div class="w-full text-center">
        <p class="text-gray-600 uppercase text-sm tracking-wide pb-3">Designer . Développer . Améliorer</p>
        <div class="relative">
            <h1 class="text-5xl font-black text-gray-800 max-w-2xl mx-auto">Je créé des sites que vos clients vont <span class="relative">
                adorer
                <div class="absolute -bottom-10 right-0 -mr-10">
                    <svg class="svg-shadow" width="176" height="78" viewBox="0 0 176 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.16866 49.7734C49.6249 56.8271 214.397 64.3995 159.471 26.2365" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                    </svg>                    
                </div>
            </span>                 
            </h1>
        </div>
        <CTALink 
        texte="Et si on en parlait !"
        isLink={true}
        link="contact"
        spacing='my-20' />
    </div>
    <div class="w-full relative">
        <Img 
        src="/static/assets/illu_intro.png" 
        alt=""
        styles="md:w-1/2 mx-auto relative z-10"/>
        <Img
        src="/static/assets/Circle-bg-yellow.png"
        alt=""
        styles="absolute bottom-10 inset-x-0" />
    </div>
</section>
<section id="services" class="container py-16">
    <!-- <TitleSvg 
    texte="Mon approche pour vous permettre d’atteindre vos"
    span="objectifs"
    svg="/static/assets/vector-services.svg" /> -->
    <div>
        <h2 class="text-4xl font-bold text-gray-800 max-w-2xl pb-20">Mon approche pour vous permettre d’atteindre vos <span class="relative">
            objectifs
            <div class="absolute -bottom-5 right-0 -mr-10">
                <svg class="svg-shadow" width="126" height="21" viewBox="0 0 126 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 17.5C25.3333 10.1666 79.7 -2.30002 122.5 6.49998" stroke="#F9F871" stroke-width="6" stroke-linecap="round"/>
                </svg>                  
            </div>
        </span>
        </h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {#each services as service}
            <Service {service} />
        {/each}
    </div>
</section>
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
    <div class="flex flex-col gap-32 lg:gap-48">
        {#each projets as projet, i}
            <Projet {projet} isImgRight={i % 2 === 0 ? false : true }/>
        {/each}
    </div>
</section>
<Testimonials {testimonials} />
<CTA />