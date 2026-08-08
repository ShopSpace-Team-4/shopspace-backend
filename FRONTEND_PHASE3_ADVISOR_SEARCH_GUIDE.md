# ShopSpace Phase 3 - Frontend Advisor, Search, and Contact Guide

This guide covers frontend integration details not already covered in the Phase 1 auth guide or Phase 2 listings guide.

## 1) Base URL

- Production: https://shopspace-backend-production.up.railway.app/api/v1
- Development: http://localhost:3001/api/v1

Frontend environment variable:

```env
VITE_API_URL=https://shopspace-backend-production.up.railway.app/api/v1
```

## 2) Advanced Listing Search

The main browse endpoint remains:

- Method: GET
- Path: /api/v1/listings
- Auth: Optional

Phase 3/4 search supports these query params:

| Frontend query param | Backend field filtered |
| --- | --- |
| `city` | `city` |
| `area` | `district` |
| `district` | `district` |
| `shopType` | `category` |
| `category` | `category` |
| `priceMin` / `priceMax` | `annualRent` |
| `sizeMin` / `sizeMax` | `areaSqm` |
| `areaMin` / `areaMax` | `areaSqm` |
| `status` | `status` |
| `amenities` | `amenities` |
| `page` / `limit` | pagination |
| `sort` | sorting |

Example:

```http
GET /api/v1/listings?city=Cairo&area=New Cairo&shopType=Retail&priceMin=100000&priceMax=1000000&sizeMin=50&sizeMax=200&status=AVAILABLE&page=1&limit=10&sort=price:asc
```

Notes:
- Filters are combined with AND logic.
- `page` must be at least `1`.
- `limit` is capped at `100`.
- `priceMin > priceMax` returns `200` with an empty result set.
- `sizeMin > sizeMax` returns `200` with an empty result set.
- Invalid `sort` returns `400`.

Allowed sort values:

```txt
createdAt:asc
createdAt:desc
updatedAt:asc
updatedAt:desc
annualRent:asc
annualRent:desc
price:asc
price:desc
areaSqm:asc
areaSqm:desc
size:asc
size:desc
title:asc
title:desc
```

## 3) WhatsApp Contact Link

`GET /api/v1/listings/:id` can include:

```json
{
  "whatsappLink": "https://wa.me/201012345678?text=Hello%2C%20I%20am%20interested%20in%20your%20ShopSpace%20listing%3A%20Prime%20Retail%20Space"
}
```

Frontend behavior:
- If `whatsappLink` exists, render a WhatsApp/contact button.
- If `whatsappLink` is `null` or absent, hide the WhatsApp button.
- Do not build this URL manually on the frontend.

Phone normalization supports Egyptian landlord numbers entered as:

```txt
01012345678
+201012345678
201012345678
```

All normalize internally to:

```txt
+201012345678
```

## 4) AI Business Advisor

The advisor is available to any authenticated user.

### 4.1 Send First Chat Message

- Method: POST
- Path: /api/v1/advisor/chat
- Auth: Required

Request:

```json
{
  "message": "What kind of business should I open in New Cairo?"
}
```

Response:

```json
{
  "message": "Advisor response generated successfully",
  "status": 200,
  "data": {
    "sessionId": "<advisor-session-id>",
    "answer": "...",
    "sources": [
      {
        "document_id": "...",
        "title": "...",
        "category": "...",
        "business_type": "..."
      }
    ],
    "disclaimer": "...",
    "recommendedListings": []
  }
}
```

Store `data.sessionId` for follow-up messages.

### 4.2 Send Follow-Up Message

- Method: POST
- Path: /api/v1/advisor/chat
- Auth: Required

Request:

```json
{
  "message": "What licenses should I consider?",
  "sessionId": "<advisor-session-id>"
}
```

The backend verifies that the session belongs to the logged-in user before forwarding the request.

### 4.3 Get Advisor Session Messages

- Method: GET
- Path: /api/v1/advisor/sessions/:sessionId/messages
- Auth: Required

The backend enforces session ownership before calling the external AI service. A user cannot read another user's advisor history even if they know the `sessionId`.

## 5) Advisor Recommendations

Advisor recommendations are generated from our own listings, not from the AI knowledge-base documents.

Current behavior:
- The backend reads the most common `category` from the advisor response sources.
- It fetches up to 3 newest `AVAILABLE` listings in that category.
- The returned listing objects use the same shape as normal listing responses.

Important:
- Do not display an AI score unless the backend later adds a real score field.
- The current API does not return a score because there is no real scoring data source.

## 6) Postman Environments

Use one collection with either environment:

- `ShopSpace-Local.postman_environment.json`
- `ShopSpace-Deployed.postman_environment.json`

Both include:

```txt
baseUrl
email
phone
password
otpCode
accessToken
refreshToken
listingId
listingIdNoPhone
advisorSessionId
```

Use `ShopSpace - Deployed` for Railway testing and `ShopSpace - Local` for local backend testing.
