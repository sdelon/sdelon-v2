import Client from '../../utils/client'
import Prismic from '@prismicio/client'

export async function get() {
    const photographies = await Client.query(
        [Prismic.Predicates.at('document.type', 'photographies')]
    )

    return {
        body: {
            photographies: photographies.results
        }
    }
}