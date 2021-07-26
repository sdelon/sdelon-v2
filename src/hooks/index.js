export async function handle({ request, resolve }) {
    const response = await resolve(request)

    return {
        ...response,
        headers: {
            ...response.headers,
            'Strict-Transport-Security': 'max-age=31536000',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        }
    }
}