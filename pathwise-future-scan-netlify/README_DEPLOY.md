# Pathwise Future Scan

Pathwise is now a static front end plus a small Node.js backend for the floating ChatGPT consultation box.

## Important

Do not share a local `file:///Users/...` path. Other people cannot open files on your computer.

Because the site now includes AI chat, pure static hosting such as GitHub Pages alone is not enough. Deploy it somewhere that can run a Node.js server, or connect the same front end to serverless functions.

## Local Run

1. Install Node.js 18 or newer.
2. Put your OpenAI API key in `.env`:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
PORT=3000
```

3. Start the server:

```bash
node server.js
```

You can also double-click `start-pathwise.command` on macOS.

4. Open:

```text
http://localhost:3000
```

## Files Required

- `server.js`
- `package.json`
- `index.html`
- `stage-01.html` through `stage-10.html`
- `styles.css`
- `app.js`
- `chat-widget.js`
- `holland-data.js`
- the full `assets/` folder

## Deployment Notes

Share the public root URL or the public `index.html` URL, not `stage-01.html`.

The correct first screen is `index.html`, which shows the cinematic opening page. Stage pages are protected so direct visits return to the opening page.

Never put `OPENAI_API_KEY` inside front-end files. It must be configured only on the backend/server.

## Netlify Deployment

This project includes a Netlify Function at `netlify/functions/chat.js`. The front end still calls `/api/chat`; `netlify.toml` redirects that path to the Netlify Function.

Recommended settings:

```text
Build command: leave empty
Publish directory: .
Functions directory: netlify/functions
```

After deploying, add these environment variables in Netlify:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5
```

Then trigger a new deploy so the function can read the variables.
