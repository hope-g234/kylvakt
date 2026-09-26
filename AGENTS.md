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

# Cold Watch — architecture rules

- Sensor data is preprocessed offline (Python) into src/data/*.json and bundled; the app has no database — hackathon dataset is static.
- AI assistant streams via server route /api/chat (src/lib/coldwatch-chat.server.ts) with the week's triage JSON as context — keeps key server-side and answers grounded in computed evidence.
