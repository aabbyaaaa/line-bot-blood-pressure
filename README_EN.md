LINE Bot — Blood Pressure Assistant

A Node.js + Express backend for a LINE Official Account that helps users explore and inquire about blood pressure monitors and related promotions. It replies to text and postback events using LINE Messaging API and presents product info with Flex Messages.

Features
- Webhook endpoint handling LINE events (`message:text`, `postback`).
- Quick Reply and buttons to guide users through product categories.
- Rich Flex Message carousels for product highlights and promotions.
- Health check endpoint `GET /` for uptime verification.
- Ready for deployment on Vercel.

Tech Stack
- Node.js, Express
- @line/bot-sdk
- dotenv for environment variables

Project Structure
- `index.js` — main server, webhook routing, event dispatching, Flex generators.
- `flex_*.json` — Flex Message templates (carousel/cards) used by replies.
- `vercel.json` — Vercel serverless configuration.

Environment Variables
Create a `.env` file (never commit it) with:

LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
PORT=3000

Local Development
1) Install dependencies:
  npm install
2) Run server:
  npm start
3) Expose webhook:
  Use ngrok/cloudflared to tunnel your local port and set the public URL in LINE Console webhook settings to `https://<public-url>/webhook`.

Deploy (Vercel)
- This repo includes `vercel.json` mapping `index.js` to @vercel/node.
- Set environment variables in Vercel Project Settings.
- Enable the webhook in LINE Console pointing to your Vercel URL `/webhook`.

Endpoints
- POST /webhook — LINE Messaging API webhook endpoint.
- GET / — health check, returns `LINE Bot is running!`.

Notes
- Large Flex payloads are currently embedded in `index.js` and partially mirrored in `flex_*.json`. For maintainability, consider extracting all Flex definitions into separate files and importing them in code.
- Only `message:text` and `postback` events are handled; consider adding a `follow` event for welcome messages.

License
ISC
