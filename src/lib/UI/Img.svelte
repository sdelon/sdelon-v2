<script>
    import { inview } from 'svelte-inview'

    export let src, alt, container_styles, styles, width, height, mq_sizes

    let isInView = false

    const options = {
        // rootMargin: '50px',
        unobserveOnEnter: true,
    }

    const handleChange = ({ detail }) => (isInView = detail.inView)

    const placeholder = src => {
        return `${src}&w=0.5&blur=200&px=16&auto=format&colorquant=150`
    }

    const display_srcset = (src, arr) => {
        let result = []
        const image_src = src.split(/[?#]/)[0]
        let single_format = arr.map(width => {
            return `${image_src}?w=${width} ${width}w`
        })

        result.push(single_format)
        return result.join(', ')
    }
</script>

<div class="{container_styles}" use:inview={options} on:change={handleChange}>
    {#if isInView}
        <img 
        src={src}  
        sizes={mq_sizes || "100vw"}
        srcset={display_srcset(src, [320, 640, 1080])}
        loading="lazy" 
        decoding="async"
        {width} 
        {height} 
        alt={alt} 
        class="{styles}">
    {:else}
        <img src={placeholder(src)} loading="lazy" {width} {height} alt={alt} class="{styles}">
    {/if}
</div>