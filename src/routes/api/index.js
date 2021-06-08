import Client from '../../utils/client'
import Prismic from '@prismicio/client'

export async function get() {
    const accueil = await Client.query(
        [Prismic.Predicates.at('document.type', 'accueil')]
    )

    return {
        body: {
            accueil: accueil.results
        }
    }
}