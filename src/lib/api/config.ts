// Default to the deployed dev backend so the hosted Telegram Mini App works out of the box.
// For local development, set EXPO_PUBLIC_API_URL=http://localhost:8081 (e.g. in a .env file).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://apidev.huntms.ai';

