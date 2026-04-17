import { serve } from "bun";
import index from "./index.html";
import { PiholeService } from "./server/services/piholeService";

if (!process.env.PIHOLE_APP_PASSWORD) {
  throw new Error("Missing Pihole app password");
}

const piholeService = new PiholeService(process.env.PIHOLE_APP_PASSWORD);

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/dns/blocking": {
      async GET(_req) {
        const response = await piholeService.getDnsBlockingStatus();
        return Response.json(response);
      },
      async POST(req) {
        const body = await req.json();
        const response = await piholeService.changeDnsBlockingStatus(
          body.blocking,
          body.timer,
        );
        return Response.json(response);
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
