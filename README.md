# Church Contributions

A React Native CLI app for managing churches, members, projects, pledges and payments. The app uses the backend described in `openapi.json` as its source of truth. Sign in with an existing account; the app does not create accounts or migrate the previous device-local data.

## Connect to the backend

Set `API_BASE_URL` in `src/app/config/api.ts` to the backend origin or its full `/api/v1` URL before building the app. The current value is `http://172.16.14.89:8080/api/v1` for a device on the same network as the development computer. Users sign in with their international-format phone number and password. Existing installations can continue to use their previously saved server address until a build-time address is set. The backend must be reachable from the device and must support the cookie session and CSRF flow described in the OpenAPI document. Use HTTPS for deployed services. The API specification contains a relative server URL, so it does not identify a deployed host.

For local development, follow the backend README to configure MySQL and bootstrap an administrator, then run `make migrate` and `make run` in the backend project. Set `COOKIE_SECURE=false` for local HTTP. Android's emulator reaches the host at `10.0.2.2`; an iOS simulator can use `127.0.0.1`. For a physical device, configure a reachable network address and bind the backend to an appropriate interface (for example `HOST=0.0.0.0`). The backend defaults to port 8000; set `PORT=8080` to match the current app configuration, or change `API_BASE_URL` to the port the backend uses. Use HTTPS and secure cookies outside local development; release builds may block plain HTTP.

The backend implementation currently uses `/churches`, although the supplied OpenAPI document lists `/churchs`. The app follows the implementation.

The app loads all pages of churches, members, projects, pledges and payments. Changes are sent to the server with the required idempotency and version headers, and the data is refreshed after a successful write. If a create or payment void has an uncertain result, retry it unchanged without closing the form; the retry key is kept only for the current signed-in session. The backend does not replay updates or archive actions, so check the refreshed record if their result is uncertain. A failed request is reported to the user. A payment allocation preview comes from the server. The API does not provide pledge editing, changing a member's home church, project membership management, church locations, or payment references; the app does not offer those local-only operations. Previously saved local records remain on the device but are not uploaded automatically.

## Run

Install dependencies with `bun install`, install iOS pods with `cd ios && pod install`, then run `bun run start` and `bun run ios` or `bun run android` from the project root.

## Check

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand --watchman=false
```
