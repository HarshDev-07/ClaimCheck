# ClaimCheck — GitHub Repository Evidence Checker

ClaimCheck inspects a **public GitHub repository, issue, or pull request** and checks technical references against the current default branch.

## Features
- Keeps the supplied ClaimCheck landing page and demo layout.
- Accepts repository URLs, issue URLs, and pull request URLs.
- Checks repository metadata, README, license, likely test files, GitHub Actions workflows, and docs.
- Checks referenced source-file paths, stack-trace line ranges, and recognizable identifiers.
- Saves every report in a local SQLite database (`data/claimcheck.db`).
- Shows recent analysis history and downloads JSON reports.
- No Gemini, OpenAI, or other paid AI API key is required.

## Run on Windows
1. Install Python 3.10 or newer.
2. Extract this ZIP.
3. Double-click `run_windows.bat` (first run) or open a terminal in this folder and run:
   ```powershell
   py -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   python server.py
   ```
4. Open http://127.0.0.1:5000
5. Paste a public GitHub repository, issue, or pull request URL.

## Example inputs
- `https://github.com/psf/requests`
- `https://github.com/psf/requests/issues/123`
- `https://github.com/psf/requests/pull/123`

## Database
SQLite is created automatically at `data/claimcheck.db`. The `/api/history` endpoint reads the most recent saved reports. To reset local history, stop the server and delete that database file.

## Important limitations
- This is a transparent, deterministic first-pass checker, **not an AI model and not a complete proof of correctness**.
- It checks the current default branch only; historical commits, private repositories, dependency behavior, and full test execution are not covered.
- It does not execute untrusted repository code. The "sandbox reproduction" checkbox is retained in the UI but is not an execution sandbox in this build.
- A file path or identifier match is supporting evidence only. Results can be `Verified`, `Refuted`, or `Unverifiable`; use human review before closing an issue.
- Public GitHub requests require internet access and are subject to GitHub's unauthenticated rate limits.

## Local endpoints
- `GET /api/health` — server/database health
- `POST /api/analyze` — analyze a public GitHub URL
- `GET /api/history` — recent saved analyses
