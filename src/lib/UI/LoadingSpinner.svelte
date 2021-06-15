<style>
    .loader > div:nth-child(2) {
        animation-delay: 0.2s;
    }

    .loader > div:nth-child(3) {
        animation-delay: 0.4s;
    }
</style>

<div class="loader w-32 h-12 rounded-full bg-gray-800 flex justify-around items-center">
    <div class="w-6 h-6 bg-gray-bg rounded-full animate-bounce"></div>
    <div class="w-6 h-6 bg-gray-bg rounded-full animate-bounce"></div>
    <div class="w-6 h-6 bg-gray-bg rounded-full animate-bounce"></div>
</div>