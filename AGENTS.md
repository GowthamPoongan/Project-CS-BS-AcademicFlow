<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- Roles live in `user_roles` (student/faculty/hod); a signup trigger assigns them, and only the first HOD request is honoured. Why: stops people from giving themselves higher access.
- Student data is read from the browser, and row-level access rules decide who sees what (students see their own rows, faculty and HOD see everyone's). Why: keeps it simple without weakening security.
- Dashboards and analytics are calculated from database rows; nothing is hard-coded. Why: a product requirement.
- Server-side AI tools belong in `src/lib/ai.functions.ts`. Why: that is where the future MCP/OpenClaw assistant will plug in.
- The PWA uses a manifest only, with no service worker. Why: home-screen install without the risk of stale caches.
