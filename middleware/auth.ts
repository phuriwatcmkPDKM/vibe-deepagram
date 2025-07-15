export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    const authUrl = config.public.authUrl;

    // Handle relative URLs (like /set-token)
    if (authUrl.startsWith("/")) {
      let redirectUrl = authUrl;

      if (to.path === "/invite") {
        // add redirect_url after logged in
        redirectUrl += `?redirect_url=${encodeURIComponent(
          to.fullPath as string
        )}`;
      }

      return navigateTo(redirectUrl);
    }

    // Handle absolute URLs (external auth services)
    try {
      const url = new URL(authUrl);
      url.pathname = "/login";

      if (to.path === "/invite") {
        // add redirect_url after logged in
        url.searchParams.set("redirect_url", to.fullPath as string);
      }

      return navigateTo(url.toString(), { external: true });
    } catch {
      // Fallback to local set-token page
      return navigateTo("/set-token");
    }
  }
});
