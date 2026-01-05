export const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:3005';

if (typeof window !== 'undefined') {
    console.log('Current API_URL:', API_URL);
}
