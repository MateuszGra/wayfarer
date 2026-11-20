# To do

Work agreed on but not started yet. Remove an item once it is done.

## Password reset

`/forgot-password` is still a placeholder: the "Nie pamiętam hasła" link leads to an empty page and nothing reaches the server.

- The player enters an e-mail address; the answer is always the same ("if the account exists, we sent a link"), so it never reveals whether an address has an account.
- The server creates a one-time random token, stores only its SHA-256 (as for sessions) and lets it expire after 30 minutes.
- The e-mail holds a link to `/reset-password?token=…`. There the player sets a new password under the same rules as at sign-up.
- Using the token deletes it and signs out every other session, as a password change in the settings does.
- Requests for a link are limited per address and per client address, so nobody can flood a mailbox.
- Needs:
  - a sending-only mailbox (e.g. `noreply@mgrabowski.eu`) with its SMTP settings in `.env` (the `SMTP_*` lines in `.env.production` are ready);
  - a migration for the tokens;
  - two endpoints, two screens and API tests.

## Before others can use the beta

- Close sign-up to a list of allowed e-mail addresses in `.env`, so only invited players can create an account.
- Redirect `http://` to `https://` on wayfarer.mgrabowski.eu (MyDevil panel).

## Later

- The weather region from the player's IP address (local GeoLite2 or DB-IP Lite); until then everyone gets Słupsk.
- A service worker, so the installed game opens without the network.
- Finish the weather layers in the scene: greyer, lower clouds when overcast, thicker fog over the land, stronger rain.
