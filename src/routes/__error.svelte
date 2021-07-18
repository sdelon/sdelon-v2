<script context="module">
    export function load({error, status}) {
        return {
            props: {
                error,
                status
            }
        }
    }
</script>

<script>
    import illu404 from '/static/assets/urban-681.png'
	export let status
</script>

<section class="container py-20 text-center">
    <h1 class="text-5xl font-black text-bleu-dark mb-5">{status}</h1>
    <p class="text-2xl font-black pb-2">Oops ! Il semblerait que la page demandée n'existe pas.</p>
    <p>N'hésitez pas à m'envoyer un <a class="font-medium text-gray-700 border-b-2 border-solid border-gray-700" href="mailto:sdelon.webdesign@gmail.com">message</a> si vous avez une question.</p>
    <img src={illu404} alt="404 illustration">
</section>