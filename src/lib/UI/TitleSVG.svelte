<script>
    export let titre, span, svg
</script>

<div>
    <h2 class="text-4xl font-bold text-gray-800 max-w-2xl pb-20">{titre} <span class="relative">
        {span}
        <div class="absolute -bottom-5 right-0 -mr-10">{svg}</div>
    </span>
    </h2>
</div>