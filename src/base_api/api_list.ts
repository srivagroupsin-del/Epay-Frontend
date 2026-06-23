// Base URLs are configured via environment variables.
// Copy .env.example to .env and set the values for your environment.
export const BASE_URL: string = import.meta.env.VITE_API_BASE_URL as string;
export const IMAGE_BASE_URL: string = import.meta.env.VITE_IMAGE_BASE_URL as string;

if (!BASE_URL) {
  throw new Error("Missing env variable: VITE_API_BASE_URL");
}
if (!IMAGE_BASE_URL) {
  throw new Error("Missing env variable: VITE_IMAGE_BASE_URL");
}