// Entry point for Passenger on MyDevil, which starts `app.js` in the application root. Passenger loads it
// with require(), which can't take a module graph with top-level await (the server awaits its start-up),
// so the server is loaded with a dynamic import instead of a static one.
import('./dist/server/main.js').catch((error) => {
  console.error(error);
  process.exit(1);
});
