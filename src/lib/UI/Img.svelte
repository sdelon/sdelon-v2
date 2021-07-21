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

    const display_srcset = (src, arr) => {
        let result = []
        const image_src = src.split('?')[0]
        let single_format = arr.map(width => {
            return `${image_src}?dpr=3&q=80&w=${width} ${width}w`
        })

        result.push(single_format)
        return result.join(', ')
    }
</script>

<div class="{container_styles}" use:inview={options} on:change={handleChange}>
    {#if isInView}
        <img 
        src={src}  
        sizes="(min-width: 48em) 50vw, 100vw"
        srcset={display_srcset(src, [100,200,300])}
        loading="lazy" 
        {width} 
        {height} 
        alt={alt} 
        class="{styles}">
    {:else}
        <img src={placeholder(src)} loading="lazy" {width} {height} alt={alt} class="{styles}">
    {/if}
</div>