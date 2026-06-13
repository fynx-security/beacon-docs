# Beacon Documentation

Product documentation for [Beacon](https://github.com/fynx-security) — continuous NIS2 compliance evidence.

Built with [Mintlify](https://mintlify.com) — same docs UX pattern used by Stripe, Cursor, and many developer products.

## Local preview (docs website)

```bash
npx mintlify dev --port 3333
```

Open **http://localhost:3333**

Requires Node.js 18+.

## Publish live

1. Push this repo to GitHub (`fynx-security/beacon-docs`)
2. Sign up at [mintlify.com](https://mintlify.com)
3. Connect the GitHub repo — Mintlify builds and hosts the docs site
4. Add custom domain e.g. `docs.yourbeacon.com`

## Structure

| Section | Content |
|---------|---------|
| Get started | Introduction, quickstart, architecture |
| Concepts | Agents, auth, scoring, events, evidence |
| Guides | Install, deploy, Clerk, fleet, exports |
| Beacon Host | Agent modules and platform matrix |
| Dashboard | UI page reference |
| Compliance | NIS2 Article 21 mapping |
| API Reference | Agent and dashboard REST endpoints |

## Related repos

- [beacon-api](https://github.com/fynx-security/beacon-api)
- [beacon-dashboard](https://github.com/fynx-security/beacon-dashboard)
- [beacon-host-agent](https://github.com/fynx-security/beacon-host-agent)
