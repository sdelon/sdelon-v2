export async function handle({ request, resolve }) {
    const response = await resolve(request)

    return {
        ...response,
        headers: {
            ...response.headers,
            'strict-transport-security': 'max-age=31536000',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'DENY',
            'x-xss-protection': '1; mode=block'
        }
    }
}