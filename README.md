# Pothole Reporter

Empowered Indian’s civic-tech platform to report potholes, track responses, and drive transparency and accountability.

This repository contains a React frontend and a Node.js/Express backend. The project is released under the GNU Affero General Public License v3.0 (AGPL-3.0) to ensure improvements made for network services are shared with the community.

## Quick Start

- Prerequisites: Node.js LTS, npm, MongoDB (or Atlas), and Image/Storage credentials if using media uploads.
- Install dependencies:
  - `cd backend && npm install`
  - `cd ../frontend && npm install`
- Configure env files (see Environment below).
- Run dev:
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && npm run dev`

## Environment

Never commit real secrets. Use the provided examples:

- Backend: `backend/.env.example` → copy to `backend/.env` and fill values.
- Frontend: `frontend/.env.example` → copy to `frontend/.env` and fill values.

Recommended .gitignore rules are in place to prevent committing `*.env` files. If you previously committed one, remove it from Git history before open-sourcing.

### Important frontend envs

- `VITE_API_URL` and related API URLs.
- `VITE_SECURE_STORAGE_KEY` (optional): A long random string (>=32 chars) used to derive an encryption key for the browser-side secure storage. If not set, the app will generate a per-session random key. This is defense-in-depth only; frontend keys are not true secrets.

## Security Notes

- Do not commit `.env` files. Use the `*.example` files as templates.
- Frontend secure storage now derives a key from either `VITE_SECURE_STORAGE_KEY` or a per-session random key, and uses a per-item random salt + IV.
- Even with encryption, any data in the browser is at risk from XSS. Keep session tokens short-lived and continue to validate on the server.

## Contributing

We welcome contributions! To keep things organized, please open an issue first to discuss proposed changes before creating a pull request. Then read `CONTRIBUTING.md` for guidelines on branches, commits, and PRs.

## Code of Conduct

We are committed to a welcoming and inclusive community. Please read `CODE_OF_CONDUCT.md`.

## License

This project is licensed under the GNU Affero General Public License v3.0. See `LICENSE` for the full text.

## Star History


[![Star History Chart](https://api.star-history.com/svg?repos=Empowered-Indian/indian-potholes&type=Date)](https://www.star-history.com/#Empowered-Indian/indian-potholes&Date)
