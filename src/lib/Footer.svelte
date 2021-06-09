<script>
    import logoSD from '../../static/assets/logo-sd-bleu.png'
    import urlFb from '../../static/assets/icon-library.svg#icon-facebook'
    import urlTwitter from '../../static/assets/icon-library.svg#icon-twitter'
    import urlLinkedIn from '../../static/assets/icon-library.svg#icon-linkedin'

    $: year = new Date().getFullYear()
</script>


<footer class="bg-gray-bg py-20">
    <div class="container px-4 mx-auto text-center">
      <a class="inline-block mx-auto text-gray-600 text-2xl leading-none" href="/">
        <img class="h-12" src={logoSD} alt="" width="auto"></a>
      <ul class="my-6 flex flex-wrap gap-4 lg:gap-8 items-center justify-center">
        <li class="mb-2 md:mb-0"><a class="text-sm text-bleu-dark hover:text-bleu-lighter" href="/">Accueil</a></li>
        <li class="mb-2 md:mb-0"><a class="text-sm text-bleu-dark hover:text-bleu-lighter" href="/#services">Services</a></li>
        <li class="mb-2 md:mb-0"><a class="text-sm text-bleu-dark hover:text-bleu-lighter" href="/#projets">Projets</a></li>
        <li sveltekit:prefetch class="mb-2 md:mb-0"><a class="text-sm text-bleu-dark hover:text-bleu-lighter" href="/photographies">Photographies</a></li>
        <li sveltekit:prefetch class="mb-2 md:mb-0"><a class="text-sm text-bleu-dark hover:text-bleu-lighter" href="/contact">Contact</a></li>
      </ul>
      <div>
        <a class="inline-block mr-2 lg:mr-10" href="https://www.facebook.com/stephanie.delon" aria-label="Facebook de Stéphanie Delon">
            <svg title="lien Facebook pour la page Chrysalide" class="text-bleu-dark hover:text-bleu-lighter cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlFb}></use>
            </svg>
        </a>
        <a class="inline-block mr-2 lg:mr-10" href="https://twitter.com/delon_stephanie" aria-label="Twitter de Stéphanie Delon">
            <svg title="lien Facebook pour la page Chrysalide" class="text-bleu-dark hover:text-bleu-lighter cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlTwitter}></use>
            </svg>
        </a>
        <a class="inline-block" href="https://www.linkedin.com/in/st%C3%A9phanie-delon-5764371b7" aria-label="LinkedIn de Stéphanie Delon">
            <svg title="lien Facebook pour la page Chrysalide" class="text-bleu-dark hover:text-bleu-lighter cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlLinkedIn}></use>
            </svg>
        </a>
        </div>
    </div>
    <div class="container mt-12 mb-8 border-b border-gray-200"></div>
    <div class="container px-4 mx-auto">
      <p class="text-center text-sm text-gray-400">© Stéphanie Delon {year} - Tous droits réservés | <a href="/mentions-legales">Mentions Légales</a></p>
    </div>
</footer>