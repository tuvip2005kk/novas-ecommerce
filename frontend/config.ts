// Hardcode API URL for Vercel deployment stability
export const API_URL = 'https://positive-enjoyment-production-27aa.up.railway.app';

if (typeof window !== 'undefined') {
    console.log('Using Hardcoded API_URL:', API_URL);
}
