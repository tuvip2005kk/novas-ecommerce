const PROD_API = 'https://positive-enjoyment-production-27aa.up.railway.app';
export const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
    ? process.env.NEXT_PUBLIC_API_URL
    : PROD_API;

if (typeof window !== 'undefined') {
    console.log('Configured API_URL:', API_URL);
}
