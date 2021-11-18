<script>
    import SEOHead from '$lib/SEOHead.svelte'
    import CTALink from '$lib/UI/CTALink.svelte'
    import Img from '$lib/UI/Img.svelte'

    let is_digital = true
</script>

<style>
  .card-shadow {
    box-shadow:
      6.7px 6.7px 5.3px rgba(0, 0, 0, 0.02),
      22.3px 22.3px 17.9px rgba(0, 0, 0, 0.03),
      100px 100px 80px rgba(0, 0, 0, 0.05);
  }

  .active {
    background-color: #0C3E3B;
    color: #F7F7F8;
  }
</style>

<SEOHead
	title="Offres et tarifs | Stéphanie Delon"
	description="Développeuse web et graphiste située dans le Cap Sizun en Finistère, découvrez ici les tarifs pour la création de votre site internet | Stéphanie Delon"
	image="https://images.prismic.io/sdelon-portfolio/377a7464-253f-4861-85ee-eb1138a9b982_stephanie-delon.jpg?auto=compress,format"
	alt="Développeuse web dans le Cap Sizun" />

<section class="relative pt-16">
    <div class="container px-4 mx-auto">
        <div class="flex flex-wrap items-center -mx-3">
            <div class="w-full lg:w-1/2 px-3">
                <div class="py-12">
                    <div class="max-w-lg lg:max-w-md mx-auto lg:mx-0 mb-8 text-center lg:text-left">
                        <h2 class="text-gray-800 font-black text-5xl mb-4">
                            <span>Des tarifs</span>
                            <span class="text-bleu-dark">adaptés</span>
                            <span>à vos projets</span>
                        </h2>
                        <p class="text-gray-700 text-lg pt-8">Collaborant principalement avec des PME, des associations et des particuliers, je vous propose des solutions adaptées à votre budget.</p>
                    </div>
                    <div class="text-center lg:text-left">
                        <CTALink 
                            texte="Je demande un devis"
                            isLink={true}
                            link="contact"
                            spacing='my-4' />
                    </div>
                </div>
            </div>
            <div class="w-full lg:w-1/2 px-3 lg:bg-blueGray-50 mb-12 lg:mb-0">
                <div class="flex items-center justify-center">
                    <img class="lg:max-w-lg" src="./static/assets/wireframe-tarifs-1.jpg" alt="Wireframe d'un site">
                </div>
            </div>
        </div>
    </div>
</section>

<section class="py-20" >
    <div class="container px-4 mx-auto">
      <div class="text-center mb-16">
        <h2 class="max-w-2xl mx-auto mb-4 text-3xl md:text-4xl font-extrabold text-gray-800">
          <span>Accompagnement personnalisé pour une communication réussie !</span>
        </h2>
        <p class="max-w-lg mx-auto text-lg text-gray-700">Définissons ensemble une stratégie digitale & print adaptée à vos clients pour permettre une visibilité et un développement de votre activité.</p>
      </div>
      <div class="mb-12 text-center w-full">
        <button class:active={is_digital} on:click={() => is_digital = true} class="w-72 sm:w-80 text-lg font-semibold bg-transparent border-4 border-bleu-dark border-solid hover:bg-bleu-dark inline-block px-10 py-2 rounded-lg text-gray-800 hover:text-gray-bg transition duration-300 mr-8 mb-8 lg:mb-0">Communication Digitale</button>
        <button class:active={!is_digital} on:click={() => is_digital = false} class="w-72 sm:w-80 text-lg font-semibold bg-transparent border-4 border-bleu-dark border-solid hover:bg-bleu-dark inline-block px-10 py-2 rounded-lg text-gray-800 hover:text-gray-bg transition duration-300 mr-8">Communication Print</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 -mx-3">
        {#if is_digital}
          <div class="px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <h3 class="mb-2 text-4xl font-bold text-gray-800">Site vitrine</h3>
              <span class="text-gray-600 text-center">À partir de</span>
              <p class="text-3xl text-gray-700 font-bold mb-8">500€</p>
              <div class="flex flex-col items-center mb-8">
                <ul class="text-gray-800">
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>3 pages</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-left">Publication du contenu (textes et images)</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>3 allers-retours</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Référencement</span>
                  </li>
                  <li class="flex">
                    <svg class="w-6 h-6 mr-2" fill="#0C3E3B" stroke="#F7F7F8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="text-left">Formation pour l'utilisation de votre site</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je demande un devis"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
          <div class="px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <h3 class="mb-2 text-4xl font-bold text-gray-800">Site e-commerce</h3>
              <span class="text-gray-600 text-center">À partir de</span>
              <p class="text-3xl text-gray-700 font-bold mb-8">1200€</p>
              <div class="flex flex-col items-center mb-8">
                <ul>
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>8 pages</span>
                  </li>
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Intégration 10 produits</span>
                  </li>
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>5 allers-retours</span>
                  </li>
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Référencement</span>
                  </li>
                  <li class="flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="#0C3E3B" stroke="#F7F7F8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span class="text-left">Formation pour l'utilisation de votre site</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je demande un devis"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
          <div class="md:col-span-2 xl:col-span-1 px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <span class="h-20 mb-4 font-bold uppercase text-sm tracking-wide text-gray-500 mx-auto">Optionnel</span>
              <h3 class="mb-2 text-3xl font-bold text-gray-800">Forfait maintenance</h3>
              <p class="text-3xl text-gray-700 font-bold mb-8">400€ <span class="text-gray-600 text-sm">/ an</span></p>
              <div class="flex flex-col items-center mb-8">
                <ul class="text-blueGray-400">
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Mise à jour du site</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Petites modifications graphiques</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Ajout de contenu</span>
                  </li>
                  <li class="flex">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Optimisation régulière des performances</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je souhaite en savoir plus"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
        {:else}
          <div class="px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <h3 class="mb-2 text-4xl font-bold text-gray-800">Carte de visite</h3>
              <span class="text-gray-600 text-center">À partir de</span>
              <p class="text-3xl text-gray-700 font-bold mb-8">100€</p>
              <div class="flex mb-8">
                <ul class="flex flex-col text-gray-800">
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>recto / verso</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-left">Proposition de 1 ou 2 pistes visuelles</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-left">3 allers-retours</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je demande un devis"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
          <div class="px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <h3 class="mb-2 text-4xl font-bold text-gray-800">Flyer / Affiche</h3>
              <span class="text-gray-600 text-center">À partir de</span>
              <p class="text-3xl text-gray-700 font-bold mb-8">250€</p>
              <div class="flex flex-col mb-8">
                <ul class="flex flex-col text-gray-800">
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Format A6</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-left">Proposition de 1 ou 2 pistes visuelles</span>
                  </li>
                  <li class="flex items-center mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>5 allers-retours</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je demande un devis"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
          <div class="md:col-span-2 xl:col-span-1 px-3 mb-6">
            <div class="card-shadow bg-yellow bg-opacity-50 pt-16 pb-8 px-4 text-center rounded">
              <h3 class="mb-2 text-4xl font-bold text-gray-800">Brochure</h3>
              <span class="text-gray-600 text-center">À partir de</span>
              <p class="text-3xl text-gray-700 font-bold mb-8">500€</p>
              <div class="flex flex-col items-center mb-8">
                <ul class="flex flex-col text-gray-800">
                  <li class="flex mb-3">
                    <svg class="flex-shrink-0 w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-left">Proposition de 2 pistes visuelles (couverture + double page type)</span>
                  </li>
                  <li class="flex mb-3">
                    <svg class="w-6 h-6 mr-2 text-bleu-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>5 allers-retours</span>
                  </li>
                </ul>
              </div>
              <div>
                <CTALink 
                    texte="Je demande un devis"
                    isLink={true}
                    link="contact"
                    spacing='my-4' />
              </div>
            </div>
          </div>
        {/if}
      </div>
      <p class="mt-8"><strong>Droit d'auteur et propriété intellectuelle</strong> : Une fois le projet validé, vous êtes propriétaire de l'ensemble des ressources le composant.</p>
      <p class="mt-2">Paiment possible en plusieurs fois, à définir au moment du devis.</p>
    </div>
</section>
           
<section class="py-8 px-4">
  <div class="flex flex-wrap items-center max-w-7xl mx-auto">
    <div class="md:w-1/2 px-4 mb-8 md:mb-0">
        <div class="flex-grow w-auto h-auto">
            <Img
              src="./static/assets/wireframe-tarifs-2.jpg"
              mq_sizes="(min-width: 760px) 50vw, 100vw"
              alt="Wireframe d'un site"
              styles="rounded shadow" />
        </div>
    </div>
    <div class="md:w-1/2 px-4 md:pl-20">
      <p class="text-gray-600 uppercase tracking-wide text-sm font-semibold pb-8">Création de site internet · Refonte de votre stratégie digitale · Communication print</p>
      <h2 class="text-4xl md:pl-8 md:border-l-8 md:border-bleu-dark font-black font-heading">Vous avez un projet spécifique à réaliser ?</h2>
      <div class="mt-6 mb-8 text-gray-light leading-relaxed">N'hésitez pas à me contacter afin que nous puissions aborder ensemble vos besoins. Mon objectif est de vous proposer un site performant et sur-mesure avec lequel vous prendrez plaisir à développer votre activité.</div>
      <CTALink isLink={true} link="contact/#formulaire" texte="Contactez-moi" spacing="my-2" />
    </div>
  </div>
</section>