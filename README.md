# Internal Comms Operations Dashboard

A working prototype for a one-human-plus-AI internal communications operation.

This project is designed as a realistic enterprise dashboard that replaces much of the admin, coordination, drafting and triage load of a traditional internal comms team. It gives a single operator an AI-assisted control centre for request intake, prioritisation, drafting, approvals, calendar management, content reuse and performance monitoring.

![Dashboard overview](./assets/dashboard-overview.svg)

## What It Does

- Captures new comms requests through a structured intake form
- Scores and prioritises requests by urgency, reach, risk and complexity
- Recommends likely audiences and best-fit channels
- Generates draft content for email, intranet, FAQ and manager brief formats
- Tracks approval workflow and current request status
- Shows an editorial and communications calendar
- Provides a searchable content repository with reusable assets
- Surfaces analytics for reach, engagement and FAQ deflection
- Highlights AI insights such as overlap risk, duplication and likely employee questions

## Prototype Highlights

- Clean enterprise-style UI designed for desktop and mobile
- Believable fake data across live requests, repository assets and performance metrics
- Fast local setup with no front-end build step
- Lightweight Node server for easy local running
- Interactive request submission flow that updates the dashboard state in real time

![Workflow and analytics preview](./assets/dashboard-workflow.svg)

## Local Run

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

```text
.
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── assets/
│   ├── dashboard-overview.svg
│   └── dashboard-workflow.svg
├── server.js
└── package.json
```

## Intended Use Case

This prototype is aimed at large enterprise internal communications teams that want to:

- reduce manual drafting and coordination overhead
- manage competing stakeholder requests with transparent prioritisation
- improve channel selection and audience targeting
- centralise reusable messaging assets
- give a single operator enough leverage to manage a broad comms portfolio with AI support

## Next Good Enhancements

- persistent storage for requests and repository items
- role-based approvals and audit trail history
- export to Word, email and CMS formats
- integration with Teams, SharePoint or intranet tooling
- analytics fed by real campaign performance data

