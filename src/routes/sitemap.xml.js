export async function get() {
    const date = new Date().toISOString().split('T')[0]

    const pages = Object.keys(import.meta.glob('/src/routes/**/!(_)*.svelte'))
    .filter(page => {
        const filters = ['_', 'private']
        return !filters.find(filter => page.includes(filter))
    })
    .map(page => {
        return page.replace('/src/routes', import.meta.env.VITE_PUBLIC_BASE_PATH).replace('/index.svelte', '').replace('.svelte', '')
    })

    const allSiteURL = pages
    .flat()
    .reduce((newArr, currItem) => {     
        let node = {}

        switch(currItem) {
            case 'https://sdelon.com/mentions-legales':
                node = {
                    loc: `${currItem}`,
                    priority: '0.5',
                    changefreq: 'never',
                    date
                }
                break;
            case 'https://sdelon.com/contact':
                node = {
                    loc: `${currItem}`,
                    priority: '1',
                    changefreq: 'yearly',
                    date
                }
                break;
            case 'https://sdelon.com':
            case 'https://sdelon.com/photographies':
                node = {
                    loc: `${currItem}`,
                    priority: '1',
                    changefreq: 'monthly',
                    date
                }
                break;
        }

        newArr.push(node)
        return newArr
    }, [])
    

    
    const urlNodes = allSiteURL
    .map((page) => {
        return `
            <url>
                <loc>${page.loc}</loc>
                <priority>${page.priority}</priority>
                <changefreq>${page.changefreq}</changefreq>
                <lastmod>${page.date}</lastmod>
            </url>
        `;
    })
    .join('\n');


    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    ${urlNodes}
    </urlset>`;
    
    return {
        body: xml,
        headers: {
            'Content-Type': 'application/xml'
        }
    }
}