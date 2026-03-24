# Project Story

## Overview

This project is a proof of concept for a new internal communications operating model: one skilled human operator using AI to replace much of the drafting, triage, coordination and admin load of a traditional internal comms team.

The goal was not to make a vague concept deck. The goal was to build something concrete that people can open, run and understand in minutes.

## The Problem

In large organisations, internal communications often breaks down in familiar ways:

- too many stakeholder requests arrive in different formats
- prioritisation is inconsistent or political
- channel choice is based on habit rather than audience need
- drafting the same message into four formats burns time
- approvals create bottlenecks
- content gets duplicated because nobody can find what already exists
- reporting sits separately from planning, so lessons arrive too late

That makes internal comms feel reactive, overloaded and hard to scale.

## The Hypothesis

A single operator can manage a much larger internal comms workload if AI is used for:

- structured intake
- triage and scoring
- first-draft generation
- duplication and risk detection
- likely-question forecasting
- workflow visibility

The human still owns judgement, sequencing, tone and stakeholder management. AI handles the repetitive operational layer around that work.

## What I Built

I built a working prototype dashboard that combines the core operating needs of an internal comms function into one interface:

- request intake form
- prioritisation and scoring
- audience and channel recommendation
- draft generation for email, intranet, FAQ and manager brief
- approval workflow tracking
- editorial and communications calendar
- content repository with search
- analytics and performance view
- AI insights for overlap, duplication, risk and likely employee questions

The product was intentionally designed with believable fake enterprise data so it feels like a real operational environment rather than a wireframe.

## Product Thinking Behind It

This concept is not just “AI writes content”.

The more interesting idea is that internal communications is an operations problem as much as a writing problem. The interface is built around that assumption:

- the operator needs visibility over load, not just drafts
- requests need scoring, not just inbox handling
- content has to be reusable, not endlessly recreated
- approvals need to be tracked as work in progress
- analytics need to feed back into future decisions
- AI should surface risk and duplication, not only produce words

## Technical Approach

The prototype is intentionally lightweight:

- static front-end in HTML, CSS and JavaScript
- minimal Node server for local use
- no framework or build chain required

That kept the focus on product logic, flow and usability while making the project easy for anyone to run quickly.

## Why This Is Useful As A Proof Of Concept

This project demonstrates several things at once:

- product thinking
- UX design for enterprise tooling
- front-end implementation
- realistic workflow modelling
- practical AI integration thinking
- ability to turn a business problem into a working prototype quickly

It is meant to be shown, not just described.

## What I Would Build Next

If this moved beyond proof of concept, the next steps would be:

- persistent storage for requests, drafts and repository assets
- user roles and approval routing
- real analytics feeds
- CMS, email and collaboration-tool integrations
- prompt or model orchestration behind the drafting and insight layers
- export workflows and audit history

## Portfolio Summary

If I were describing this project in one line:

I built a proof-of-concept internal communications operating system that shows how one human plus AI can manage the planning, drafting, approval and insight workload of an enterprise comms function.
