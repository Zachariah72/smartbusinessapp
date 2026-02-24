# API v1

## Health
- `GET /api/v1/auth/health`
- `POST /api/v1/auth/session`
- `POST /api/v1/auth/signout`
- `GET /api/v1/auth/sessions/:businessId`

## Upload + Ingestion
- `POST /api/v1/upload`
  - Body: `{ businessId, fileName, content, encoding?: "plain"|"base64" }`
- `GET /api/v1/upload/:businessId`

## Dashboard
- `GET /api/v1/dashboard/:businessId`

## Ledger
- `GET /api/v1/ledger/:businessId`
- `POST /api/v1/ledger`

## POS
- `POST /api/v1/pos/connect`
- `POST /api/v1/pos/sync`
- `GET /api/v1/pos/:businessId`

## Entities
- `GET /api/v1/entities/:businessId`

## Review Queue
- `GET /api/v1/review/:businessId`
- `POST /api/v1/review/:businessId/:reviewId/approve`
- `POST /api/v1/review/:businessId/:reviewId/reject`

## Goals
- `GET /api/v1/goals/:businessId`
- `POST /api/v1/goals`
- `PUT /api/v1/goals/:goalId/:businessId`
- `DELETE /api/v1/goals/:goalId/:businessId`

## Preferences
- `GET /api/v1/preferences/:businessId`
- `PUT /api/v1/preferences`
