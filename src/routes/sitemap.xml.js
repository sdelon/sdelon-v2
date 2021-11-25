export async function get() {
    const date = new Date().toISOString().split('T')[0]

    const pages = Object.keys(import.meta.glob('/src/routes/**/!(_)*.svelte'))
    .filter(page => {
        const filters = ['_', 'private']
        return !filters.find(filter => page.includes(filter))
    })
    .map(page => {
        return page.replace('/src/routes', 'https://sdelon.com').replace('/index.svelte', '').replace('.svelte', '')
    })

    const allSiteURL = pages
    .reduce((newArr, currItem) => {     
        let node = {}
        switch(currItem) {
            case 'https://sdelon.com':
                node = {
                    loc: `${currItem}`,
                    priority: '1',
                    changefreq: 'yearly',
                    date
                }
                break;
            case 'https://sdelon.com/mentions-legales':
                node = {
                    loc: `${currItem}`,
                    priority: '0.5',
                    changefreq: 'never',
                    date
                }
                break;
            case 'https://sdelon.com/merci':
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
            case 'https://sdelon.com/tarifs':
                node = {
                    loc: `${currItem}`,
                    priority: '1',
                    changefreq: 'yearly',
                    date
                }
                break;
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
    .join('');

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
            'Cache-Control': 'max-age=0, s-maxage=3600',
            'Content-Type': 'application/xml',
        }
    }
}