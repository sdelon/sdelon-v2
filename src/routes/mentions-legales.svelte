<script context="module">
    export async function load({ fetch }) {
        const { accueil } = await fetch('/api').then(res => res.json())
        let cta = accueil[0].data.body.filter(slice => slice.slice_type === "cta")

        return {
            props: {
                slice: cta[0]
            }
        }
    }
</script>

<script>
    import CTA from '$lib/CTA.svelte'

    export let slice

</script>

<style>
    .width {
        @apply w-full md:w-2/3;
    }

    h1 {
        @apply text-3xl font-bold mb-8;
    }

    h2 {
        @apply font-bold mb-2;
    }

    p {
        @apply mb-8;
    }

    a {
        @apply underline text-bleu-lighter;
    }
</style>

<section class="container py-16">
    <div class="width mx-auto">
        <h1>Mentions légales</h1>
        <h2>Présentation du site</h2>
        <p>En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs (Internaute se connectant, utilisant le site susnommé) du site <a href="https://sdelon.com/">sdelon.com</a> l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi : Propriétaire : – SIRET – 1 Interridi - 29770 Goulien
        Responsable publication : – sdelon.webdesign@gmail.com
        Le responsable publication est une personne physique ou une personne morale
        Hébergeur : Netlify – 2325 3rd Street Suite 215, San Francisco 94107, USA
        Crédits : Le modèle de mentions légales est offert par Subdelirium.com Modèle de mentions légales</p>
        <h2>Propriété intellectuelle et contrefaçons</h2>
        <p>Stéphanie Delon est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable. Toute exploitation non autorisée du site ou de l’un quelconque des éléments qu’il contient sera considérée comme constitutive d’une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.</p>
        <h2>Gestion des données personnelles</h2>
        <p>En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995. À l'occasion de l'utilisation du site <a href="https://sdelon.com/">sdelon.com</a>, peuvent êtres recueillies : l'URL des liens par l'intermédiaire desquels l'utilisateur a accédé au site <a href="https://sdelon.com/">sdelon.com</a>, le fournisseur d'accès de l'utilisateur, l'adresse de protocole Internet (IP) de l'utilisateur. En tout état de cause ne collecte des informations personnelles relatives à l'utilisateur que pour le besoin de certains services proposés par le site <a href="https://sdelon.com/">sdelon.com</a>. Conformément aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés, tout utilisateur dispose d’un droit d’accès, de rectification et d’opposition aux données personnelles le concernant, en effectuant sa demande écrite et signée, accompagnée d’une copie du titre d’identité avec signature du titulaire de la pièce, en précisant l’adresse à laquelle la réponse doit être envoyée. Aucune information personnelle de l'utilisateur du site <a href="https://sdelon.com/">sdelon.com</a> n'est publiée à l'insu de l'utilisateur, échangée, transférée, cédée ou vendue sur un support quelconque à des tiers. Seule l'hypothèse du rachat de et de ses droits permettrait la transmission des dites informations à l'éventuel acquéreur qui serait à son tour tenu de la même obligation de conservation et de modification des données vis à vis de l'utilisateur du site <a href="https://sdelon.com/">sdelon.com</a>. Le site n'est pas déclaré à la CNIL car il ne recueille pas d'informations personnelles. Les bases de données sont protégées par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative à la protection juridique des bases de données.</p>
        <h2>Liens hypertextes et cookies</h2>
        <p>Le site <a href="https://sdelon.com/">sdelon.com</a> contient un certain nombre de liens hypertextes vers d’autres sites, mis en place avec l’autorisation des directeurs de publication de ces sites. Cependant, stéphanie Delon n’a pas la possibilité de vérifier le contenu des sites ainsi visités, et n’assumera en conséquence aucune responsabilité de ce fait. La navigation sur le site <a href="https://sdelon.com/">sdelon.com</a> est susceptible de provoquer l’installation de cookie(s) d’analyse sur l’ordinateur de l’utilisateur. Un cookie est un fichier de petite taille, qui ne permet pas l’identification de l’utilisateur, mais qui enregistre des informations relatives à la navigation d’un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation. L’utilisateur peut toutefois refuser ces cookies et configurer son ordinateur de la manière suivante, pour refuser l’installation des cookies : Sous Internet Explorer : onglet outil (pictogramme en forme de rouage en haut a droite) / options internet. Cliquez sur Confidentialité et choisissez Bloquer tous les cookies. Validez sur Ok. Sous Firefox : en haut de la fenêtre du navigateur, cliquez sur le bouton Firefox, puis aller dans l'onglet Options. Cliquer sur l'onglet Vie privée. Paramétrez les Règles de conservation sur : utiliser les paramètres personnalisés pour l'historique. Enfin décochez-la pour désactiver les cookies. Sous Safari : Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par un rouage). Sélectionnez Paramètres. Cliquez sur Afficher les paramètres avancés. Dans la section "Confidentialité", cliquez sur Paramètres de contenu. Dans la section "Cookies", vous pouvez bloquer les cookies. Sous Chrome : Cliquez en haut à droite du navigateur sur le pictogramme de menu (symbolisé par trois lignes horizontales). Sélectionnez Paramètres. Cliquez sur Afficher les paramètres avancés. Dans la section "Confidentialité", cliquez sur préférences. Dans l'onglet "Confidentialité", vous pouvez bloquer les cookies.</p>
        <h2>Droit applicable et attribution de juridiction.</h2>
        <p>Tout litige en relation avec l’utilisation du site <a href="https://sdelon.com/">sdelon.com</a> est soumis au droit français. Il est fait attribution exclusive de juridiction aux tribunaux compétents de Quimper.</p>
        <h2>Les principales lois concernées.</h2>
        <p>Loi n° 78-17 du 6 janvier 1978, notamment modifiée par la loi n° 2004-801 du 6 août 2004 relative à l'informatique, aux fichiers et aux libertés. Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.</p>
    </div>
</section>
<CTA {slice} />
