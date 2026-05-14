# RoastMyWork Browser Extension

Manifest V3 companion extension for Chrome and Edge.

## What it does

- Captures selected text or readable text from the current page.
- Sends context to the public RoastMyWork career chat endpoint.
- Lets signed-in users generate an outreach kit from a job post, recruiter profile, or company page.
- Adds a right-click action: **Send selection to RoastMyWork**.

## Local install

1. Start the Django backend.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this `extension` folder.
6. Open the extension settings panel and confirm the API base URL, usually `http://localhost:8000/api`.

For production, set the API base URL to your deployed backend `/api` URL.

## Backend note

The backend needs to allow browser extension origins through CORS. This repo includes default regexes for Chrome and Firefox extension origins in `backend/roastmywork/settings.py`.
