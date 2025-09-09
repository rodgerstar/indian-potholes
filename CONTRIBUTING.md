# Contributing Guide

Thank you for your interest in contributing! This project aims to bring transparency, accountability, and participation into governance. We welcome issues, discussions, and PRs.

## Ways to Contribute
- File issues: bug reports, feature requests, and documentation gaps
- Submit pull requests with focused changes and tests where applicable
- Improve accessibility, performance, and security

## Development Setup
- Backend: Node.js/Express + MongoDB
- Frontend: React + Vite
- Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`
- Install deps and run dev servers

## Before You Start
- Please open an issue to propose and discuss your change before creating a PR. This helps avoid duplicate work and keeps plans aligned.

## Branching & Commits
- Create feature branches from `main`: `feature/<short-desc>` or `fix/<short-desc>`
- Write clear, descriptive commit messages (imperative mood)
- Keep PRs focused and small where possible

## Pull Request Checklist
- Code compiles and lints locally
- No secrets in code or configs (no real `.env` files committed)
- Includes tests or manual test steps as appropriate
- Updates docs if behavior or configuration changes

## Security
- Never commit credentials or access tokens
- If you find a security issue, please report privately to: roshan@empoweredindian.in

## License
By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license of this project.
