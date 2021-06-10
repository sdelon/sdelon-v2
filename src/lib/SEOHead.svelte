<script>
    import { page } from '$app/stores'
    export let title, description, image, alt

    $: url = `https://${$page.host}${$page.path}`
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description}>
    <meta name="robots" content="index,follow">

    <link rel="canonical" href={url}>

    <!-- Facebook Open Graph -->
    <meta property="og:url" content={url}>
    <meta property="og:type" content="website">
    <meta property="og:title" content={title}>
    <meta property="og:image" content={image}>
    <meta property="og:image:alt" content={alt}>
    <meta property="og:description" content={description}>
    <meta property="og:site_name" content="Développeuse web et graphiste basée dans le Cap Sizun en Finistère et disponible où que vous soyez | Stéphanie Delon">
    <meta property="og:locale" content="fr_FR">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content={url}>
    <meta name="twitter:title" content={title}>
    <meta name="twitter:description" content={description}>
    <meta name="twitter:image" content={image}>
    <meta name="twitter:image:alt" content={alt}>
</svelte:head>