<script>
    export let testimonials
</script>

<section class="bg-testimonials-bg my-16">
    <div class="container py-28 relative grid grid-cols-1 md:grid-cols-4 gap-8">
        <svg class="absolute top-5 left-5 md:left-0" width="143" height="120" viewBox="0 0 143 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.3" clip-path="url(#clip0)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z" fill="#C2B77B"/>
            </g>
            <defs>
            <clipPath id="clip0">
            <rect width="143" height="120" fill="white"/>
            </clipPath>
            </defs>
        </svg>
        <div class="col-span-2">
            <h2 class="text-4xl font-black text-gray-800 relative z-10 pb-2">Témoignages</h2>
            <p class="text-gray-600">Dynamically provide access to extensible.</p>
        </div>
        <div class="bg-gray-bg p-8 col-start-1 col-span-2 md:col-start-3 md:col-span-2 rounded-lg md:place-self-start shadow-lg relative">
            <div class="absolute -top-2 left-2">
                <svg class="absolute top-5 left-5 md:left-0" width="20" height="16" viewBox="0 0 143 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.3" clip-path="url(#clip0)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z" fill="#C2B77B"/>
                    </g>
                    <defs>
                    <clipPath id="clip0">
                    <rect width="143" height="120" fill="white"/>
                    </clipPath>
                    </defs>
                </svg>
            </div>
            <p class="pb-6">{testimonials[0].temoignage}</p>
            <p class="font-bold text-lg">{testimonials[0].nom}</p>
            <p class="text-gray-700">{testimonials[0].titre}</p>
        </div>
        <div class="bg-gray-bg p-8 col-start-1 col-span-2 lg:col-start-2 lg:col-span-1 rounded-lg shadow-lg relative">
            <div class="absolute -top-2 left-2">
                <svg class="absolute top-5 left-5 md:left-0" width="20" height="16" viewBox="0 0 143 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.3" clip-path="url(#clip0)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z" fill="#C2B77B"/>
                    </g>
                    <defs>
                    <clipPath id="clip0">
                    <rect width="143" height="120" fill="white"/>
                    </clipPath>
                    </defs>
                </svg>
            </div>
            <p class="pb-6">{testimonials[1].temoignage}</p>
            <p class="font-bold text-lg">{testimonials[1].nom}</p>
            <p class="text-gray-700">{testimonials[1].titre}</p>
        </div>
        <div class="absolute bottom-0 right-0 opacity-5 w-1/2 z-10">
            <img src="/static/assets/Hello.svg" alt="">
        </div>
        <div class="bg-gray-bg p-8 col-start-1 col-span-2 md:row-start-2 md:col-start-3 rounded-lg md:place-self-start shadow-lg relative">
            <div class="absolute -top-2 left-2">
                <svg class="absolute top-5 left-5 md:left-0" width="20" height="16" viewBox="0 0 143 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g opacity="0.3" clip-path="url(#clip0)">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M142.373 18.7419C121.049 29.1541 110.387 41.3882 110.387 55.4447C119.476 56.4859 126.992 60.1735 132.934 66.5076C138.877 72.8417 141.849 80.1735 141.849 88.5033C141.849 97.3536 138.965 104.816 133.197 110.889C127.428 116.963 120.175 120 111.435 120C101.647 120 93.1701 116.052 86.0037 108.156C78.8374 100.26 75.2542 90.6725 75.2542 79.3926C75.2542 45.553 94.306 19.089 132.41 0L142.373 18.7419ZM67.1186 18.7419C45.6196 29.1541 34.8702 41.3882 34.8702 55.4447C44.134 56.4859 51.7373 60.1735 57.6801 66.5076C63.6229 72.8417 66.5943 80.1735 66.5943 88.5033C66.5943 97.3536 63.6666 104.816 57.8112 110.889C51.9557 116.963 44.6584 120 35.919 120C26.1308 120 17.6973 116.052 10.6184 108.156C3.53942 100.26 0 90.6725 0 79.3926C0 45.553 18.9643 19.089 56.8935 0L67.1186 18.7419Z" fill="#C2B77B"/>
                    </g>
                    <defs>
                    <clipPath id="clip0">
                    <rect width="143" height="120" fill="white"/>
                    </clipPath>
                    </defs>
                </svg>
            </div>
            <p class="pb-6">{testimonials[2].temoignage}</p>
            <p class="font-bold text-lg">{testimonials[2].nom}</p>
            <p class="text-gray-700">{testimonials[2].titre}</p>
        </div>
    </div>
</section>