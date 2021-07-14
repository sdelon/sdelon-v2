<script>
    import NavList from '$lib/UI/NavList.svelte'
    import logoSD from '/static/assets/logo-sd-bleu.png'
    import urlFb from '/static/assets/icon-library.svg#icon-facebook'
    import urlTwitter from '/static/assets/icon-library.svg#icon-twitter'
    import urlLinkedIn from '/static/assets/icon-library.svg#icon-linkedin'

    $: year = new Date().getFullYear()
</script>

<footer class="bg-gray-bg py-20">
    <div class="container px-4 mx-auto text-center">
      <a class="inline-block mx-auto text-gray-600 text-2xl leading-none" href="/">
        <img class="h-12" src={logoSD} alt="SDelon accueil" width="auto">
      </a>
      <nav>
          <NavList 
          styles="my-6 flex flex-wrap gap-4 lg:gap-8 items-center justify-center"
          item_styles="mb-2 md:mb-0"
          link_styles="font-medium text-bleu-dark hover:text-bleu-lighter"/>
      </nav>
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
    <div class="container my-8 border-b border-gray-200"></div>
    <div class="container px-4 mx-auto">
      <p class="text-center text-sm text-gray-light">© Stéphanie Delon {year} - Tous droits réservés | <a href="/mentions-legales">Mentions Légales</a></p>
    </div>
</footer>