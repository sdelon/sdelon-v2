<script>
    import logoSD from '../../static/assets/logo-sd-bleu.png'
    import urlFb from '../../static/assets/icon-library.svg#icon-facebook'
    import urlTwitter from '../../static/assets/icon-library.svg#icon-twitter'
    import urlLinkedIn from '../../static/assets/icon-library.svg#icon-linkedin'
</script>

<footer class="bg-gray-bg py-6">
    <div class="container flex flex-col md:flex-row justify-between">
        <div class="flex justify-start">
            <a href="/">
              <span class="sr-only">Stéphanie Delon</span>
              <img class="h-8 w-auto sm:h-10" src={logoSD} alt="">
            </a>
        </div>
        <ul class="flex flex-wrap gap-5">
            <li class="list-none">
                <a sveltekit:prefetch href="/" class="text-base font-medium text-bleu-dark hover:text-gray-900">Accueil</a>
            </li>
            <li class="list-none">
                <a href="/#services" class="text-base font-medium text-bleu-dark hover:text-gray-900">Services</a>
            </li>
            <li class="list-none">
                <a href="/#projets" class="text-base font-medium text-bleu-dark hover:text-gray-900">Projets</a>
            </li>
            <li class="list-none">
                <a sveltekit:prefetch href="/photographies" class="text-base font-medium text-bleu-dark hover:text-gray-900">Photographies</a>
            </li>
        </ul>
        <div class="flex space-x-5">
            <a href="https://www.facebook.com/stephanie.delon" aria-label="Facebook de Stéphanie Delon">
                <svg title="lien Facebook pour la page Chrysalide" class="text-violine-dark hover:text-gray-300 cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlFb}></use>
                </svg>
            </a>
            <a href="https://twitter.com/delon_stephanie" aria-label="Twitter de Stéphanie Delon">
                <svg title="lien Facebook pour la page Chrysalide" class="text-violine-dark hover:text-gray-300 cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlTwitter}></use>
                </svg>
            </a>
            <a href="https://www.linkedin.com/in/st%C3%A9phanie-delon-5764371b7" aria-label="LinkedIn de Stéphanie Delon">
                <svg title="lien Facebook pour la page Chrysalide" class="text-violine-dark hover:text-gray-300 cursor-pointer" fill="currentColor" role="img" width="18" height="18">
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href={urlLinkedIn}></use>
                </svg>
            </a>
        </div>
    </div>
</footer>