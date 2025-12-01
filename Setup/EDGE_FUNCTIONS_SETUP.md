## ⚙️ Actonbrand 2.0 — Edge Functions Setup

Production-ready guide to recreate, configure, test, and deploy Supabase Edge Functions for Actonbrand 2.0. Uses Deno runtime on Supabase’s global edge.

Security note
- Do not commit secrets to git or paste them in chats/issues.
- Rotate any keys that were previously shared.
- Store secrets only via supabase secrets.


## Overview
We deploy four functions:
- social-analytics: Pull and persist social metrics (cron + ad‑hoc HTTP).
- replicate-proxy: Server-side proxy for Replicate API requests.
- anthropic-proxy: Server-side proxy for Claude (Anthropic) requests.
- openai-proxy: Server-side proxy for OpenAI requests.

Default auth is verify-jwt (requires Authorization: Bearer <JWT>). Use --no-verify-jwt only for truly public endpoints and add your own auth/rate limiting.


## Prerequisites
```bash
# Install CLI
brew install supabase/tap/supabase   # or: npm i -g supabase

# Login and link your Supabase project
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

You’ll need project Owner/Maintainer role. Configure CORS/redirects for your frontends in Dashboard → Auth → URL config.


## Project Layout
```
supabase/
└── functions/
    ├── social-analytics/
    │   └── index.ts
    ├── replicate-proxy/
    │   └── index.ts
    ├── anthropic-proxy/
    │   └── index.ts
    └── openai-proxy/
        └── index.ts
docs/
└── EDGE_FUNCTIONS_SETUP.md   ← this file
```


## Create Functions
```bash
supabase functions new social-analytics
supabase functions new replicate-proxy
supabase functions new anthropic-proxy
supabase functions new openai-proxy
```

Paste these minimal handlers into each function’s index.ts.

### supabase/functions/social-analytics/index.ts
```ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("SOCIAL_ANALYTICS_KEY");
  if (!apiKey) return new Response("Missing SOCIAL_ANALYTICS_KEY", { status: 500 });

  // Example: call your analytics provider
  const r = await fetch("https://api.your-social-analytics.com/v1/report", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!r.ok) return new Response(await r.text(), { status: r.status });
  const data = await r.json();

  // Optional: write to Supabase DB with service role
  // import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  // const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // await supabase.from("social_analytics").insert({ payload: data });

  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "Content-Type": "application/json" }
  });
});
```

### supabase/functions/replicate-proxy/index.ts
```ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Use POST", { status: 405 });

  const token = Deno.env.get("REPLICATE_API_TOKEN");
  if (!token) return new Response("Missing REPLICATE_API_TOKEN", { status: 500 });

  const body = await req.json(); // { model, version, input: {...} }
  const r = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" }
  });
});
```

### supabase/functions/anthropic-proxy/index.ts
```ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Use POST", { status: 405 });

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

  const body = await req.json(); // { messages:[...], model:"claude-3-5-sonnet-20241022", ... }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" }
  });
});
```

### supabase/functions/openai-proxy/index.ts
```ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Use POST", { status: 405 });

  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

  const body = await req.json(); // { model:"gpt-4o-mini", messages:[...], ... }
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" }
  });
});
```


## Secrets (rotate and set)
Set secrets per environment; never commit them.
```bash
# Supabase
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set SUPABASE_ANON_KEY=<anon-key>

# Social analytics provider
supabase secrets set SOCIAL_ANALYTICS_KEY=<ROTATED_SOCIAL_ANALYTICS_KEY>

# Replicate
supabase secrets set REPLICATE_API_TOKEN=<ROTATED_REPLICATE_TOKEN>

# Anthropic (Claude)
supabase secrets set ANTHROPIC_API_KEY=<ROTATED_ANTHROPIC_KEY>

# OpenAI
supabase secrets set OPENAI_API_KEY=<ROTATED_OPENAI_KEY>
```

List/inspect:
```bash
supabase secrets list
```


## Local Development
```bash
supabase functions serve --env-file ./supabase/.env
# Endpoint: http://localhost:54321/functions/v1/<function-name>
```

Test locally (verify-jwt is off during serve):
```bash
curl -i http://localhost:54321/functions/v1/openai-proxy \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hello"}]}'
```


## Deployment
```bash
supabase functions deploy social-analytics
supabase functions deploy replicate-proxy
supabase functions deploy anthropic-proxy
supabase functions deploy openai-proxy
```

URLs:
- https://<project-ref>.functions.supabase.co/social-analytics
- https://<project-ref>.functions.supabase.co/replicate-proxy
- https://<project-ref>.functions.supabase.co/anthropic-proxy
- https://<project-ref>.functions.supabase.co/openai-proxy

Require JWT (default). For public endpoints (not recommended), deploy with --no-verify-jwt and implement your own auth/rate limiting.


## Scheduling (social-analytics)
1) Dashboard → Edge Functions → social-analytics → Add Schedule.  
2) Example cron: `0 3 * * *` (daily at 03:00 UTC).  
3) Keep verify-jwt ON — Supabase schedules invoke with an internal JWT.


## Auth Patterns
- verify-jwt (default): clients call with Authorization: Bearer <JWT> (anon or user token).
- Forward user JWT to respect RLS when using supabase-js.
```ts
// Example if you need DB reads under caller's RLS:
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
//   global: { headers: { Authorization: req.headers.get("Authorization")! } }
// });
```
- Service role (admin): Use SUPABASE_SERVICE_ROLE_KEY for backend-only jobs/webhooks (bypasses RLS).


## Test Calls (deployed)
```bash
curl -i https://<project-ref>.functions.supabase.co/anthropic-proxy \
  -H "Authorization: Bearer <anon_or_user_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","messages":[{"role":"user","content":"Hello"}]}'
```


## Observability & CORS
- Logs: Dashboard → Edge Functions → Logs (console.log output appears here).
- CORS (if calling from browsers/public origins):
```ts
const cors = {
  "Access-Control-Allow-Origin": "*", // tighten for production
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Return responses with: { ...cors, "Content-Type": "application/json" }
```


## Security Checklist
- Rotate any keys previously shared; never store secrets in git.
- Prefer verify-jwt; only use --no-verify-jwt if you add your own auth/rate limits.
- Validate/limit request payloads; handle upstream errors defensively.
- Use service role only for backend-only workloads (webhooks/cron).
- Principle of least privilege; audit logs regularly.


## Troubleshooting
- 401 Unauthorized → Missing or invalid Authorization header.
- 404 Not Found → Function not deployed or wrong path.
- “Missing XYZ key” → Check `supabase secrets list`, set again.
- CORS error in browser → Add CORS headers and configure allowed origins.
- Upstream 5xx → Log `await r.text()` to inspect provider response.


## Quick Rebuild Checklist
1) Create functions (four folders) and paste the handlers above.  
2) Set rotated secrets via supabase secrets set.  
3) Run locally with supabase functions serve and test via curl.  
4) Deploy each function with supabase functions deploy <name>.  
5) Add a schedule to social-analytics if needed.  
6) Wire your frontend/backend to call the function URLs with Authorization.  


## Notes
- Keep functions small, composable, and focused.
- Add input schema validation (e.g., zod) as you harden endpoints.
- Consider structured logs for better observability.


