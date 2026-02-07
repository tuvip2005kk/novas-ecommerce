// Dynamic API URL selection
// Prioritize environment variable, fallback to localhost for dev, or Railway for prod
export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://positive-enjoyment-production-27aa.up.railway.app'
        : 'http://localhost:3001');

if (typeof window !== 'undefined') {
    console.log('Current API_URL:', API_URL);
}
