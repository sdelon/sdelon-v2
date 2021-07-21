<script>
    import { inview } from 'svelte-inview'

    export let src, alt, container_styles, styles, width, height

    let isInView = false

    const options = {
        rootMargin: '50px',
        unobserveOnEnter: true,
    }

    const handleChange = ({ detail }) => (isInView = detail.inView)

    const placeholder = src => {
        return `${src}&blur=200&px=16`
    }
</script>

<div class="{container_styles}" use:inview={options} on:change={handleChange}>
    {#if isInView}
        <img src={src} loading="lazy" {width} {height} alt={alt} class="{styles}">
    {:else}
        <img src={placeholder(src)} loading="lazy" {width} {height} alt={alt} class="{styles}">
    {/if}
</div>