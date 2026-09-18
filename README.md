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

### GitHub Pages (this repo)

Docs build from MDX via `scripts/build-static-docs.mjs` (no Mintlify Enterprise export required).

1. Repo must be **public** (GitHub Free cannot serve Pages from private repos)
2. Push to `main` — Actions deploys automatically
3. Site: **https://fynx-security.github.io/beacon-docs/**

Local static preview:

```bash
npm install marked@15
DOCS_BASE_PATH= node scripts/build-static-docs.mjs
npx serve _site
```

### Mintlify hosting (optional)

For the full Mintlify UI, connect the repo at [mintlify.com](https://mintlify.com) and use their hosted domain.

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
