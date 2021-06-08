<script>
    import imgix, { placeholder } from 'svelte-imgix'
    export let src, alt, styles, width, height
</script>

<img use:imgix={src} src={placeholder(src)} loading="lazy" {width} {height} {alt} class="{styles}">