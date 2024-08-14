import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the public routes that should bypass authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhook',
  '/sign-in(.*)',
  '/sign-up(.*)', 
]);

// Define the middleware function
export default clerkMiddleware(async (auth, request) => {
  // Check if the current route is public
  if (isPublicRoute(request)) {
    return; // Allow public routes without authentication
  }

  // Protect routes that are not public
  auth().protect();
});

// Middleware configuration
export const config = {
  matcher: [
    // Match all routes except those for Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run middleware for API and TRPC routes
    '/(api|trpc)(.*)',
  ],
};