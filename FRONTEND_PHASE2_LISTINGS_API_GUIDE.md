# ShopSpace Phase 2 - Frontend Listings API Guide

This document is meant for the frontend team. It summarizes the Phase 2 Listings, Media, Search, and Saved Listings backend API.

## 1) Base URL

- Production: https://shopspace-backend-production.up.railway.app/api/v1
- Development: http://localhost:3001/api/v1

Example:
- https://shopspace-backend-production.up.railway.app/api/v1/listings

Frontend environment variable:

```env
VITE_API_URL=https://shopspace-backend-production.up.railway.app/api/v1
```

Quick endpoint reference:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/verify`
- `GET /users/me`
- `PATCH /users/me/roles`
- `POST /listings`
- `POST /listings/:listingId/media`

## 2) Response Format

Most successful responses follow this pattern:

```json
{
  "message": "Success message",
  "status": 200,
  "data": {}
}
```

Exception:
- `GET /api/v1/listings/meta` returns `{ "success": true, "data": ... }` because it is static metadata for frontend form rendering.

## 3) Authentication

Use the access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

Important:
- Public listing endpoints work without a token.
- If a token is sent to public listing endpoints, the backend can return `isSaved`.
- Create/update/delete listing and media endpoints require a landlord user.
- Authorization is based on `roles`, not `activeRole`.

## 4) Listing Metadata

### 4.1 Get Listing Metadata

- Method: GET
- Path: /api/v1/listings/meta
- Auth: Public

Use this before rendering the Add Listing form.

Success response:

```json
{
  "success": true,
  "data": {
    "categories": ["Retail", "Showroom", "Office", "Warehouse", "Kiosk", "Restaurant", "Other"],
    "amenities": ["PARKING", "SECURITY", "AC"],
    "statuses": ["PENDING", "AVAILABLE", "RENTED", "EXPIRED"]
  }
}
```

Notes:
- The arrays come from backend enums.
- Do not hardcode these lists in the frontend if possible.

## 5) Listing Endpoints

### 5.1 Create Listing

- Method: POST
- Path: /api/v1/listings
- Auth: Required
- Role: `landlord`

Request body:

```json
{
  "title": "Prime Retail Space",
  "category": "Retail",
  "areaSqm": 120,
  "city": "Cairo",
  "district": "New Cairo",
  "address": "Building 12, Street 90",
  "description": "Street-facing retail space with strong visibility.",
  "amenities": ["PARKING", "SECURITY", "AC"],
  "numberOfFloors": 1,
  "floorNumber": 0,
  "availableFrom": "2026-09-01",
  "minimumLeaseTerm": "1 year",
  "annualRent": 600000,
  "currency": "EGP",
  "securityDepositMonths": 3
}
```

Success response:

```json
{
  "message": "Listing created successfully",
  "status": 201,
  "data": {
    "id": "<listing-id>",
    "status": "PENDING",
    "annualRent": 600000,
    "annualRentWithVat": 690000,
    "currency": "EGP",
    "media": [],
    "isSaved": false
  }
}
```

Notes:
- New listings start as `PENDING`.
- Publishing is manual through the status endpoint.
- `floorNumber: 0` means ground floor.
- `minimumLeaseTerm` is free text.

---

### 5.2 Browse Listings

- Method: GET
- Path: /api/v1/listings
- Auth: Optional

Query params:

```txt
city=Cairo
district=New Cairo
category=Retail
priceMin=100000
priceMax=1000000
areaMin=50
areaMax=200
status=AVAILABLE
amenities=PARKING,AC
page=1
limit=10
sort=annualRent:asc
```

Example:

```http
GET /api/v1/listings?city=Cairo&category=Retail&priceMin=100000&priceMax=1000000
```

Success response:

```json
{
  "message": "success",
  "status": 200,
  "data": {
    "items": [
      {
        "id": "<listing-id>",
        "title": "Prime Retail Space",
        "category": "Retail",
        "areaSqm": 120,
        "city": "Cairo",
        "district": "New Cairo",
        "annualRent": 600000,
        "annualRentWithVat": 690000,
        "currency": "EGP",
        "thumbnailUrl": "https://res.cloudinary.com/<cloud-name>/image/upload/...",
        "isSaved": true
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

Notes:
- `annualRentWithVat` is computed by the backend as `annualRent * 1.15`.
- `isSaved` is only meaningful when a valid token is sent.
- Without auth, `isSaved` may be absent.

---

### 5.3 Get Listing By ID

- Method: GET
- Path: /api/v1/listings/:id
- Auth: Optional

Success response:

```json
{
  "message": "success",
  "status": 200,
  "data": {
    "id": "<listing-id>",
    "landlordId": "<user-id>",
    "title": "Prime Retail Space",
    "category": "Retail",
    "areaSqm": 120,
    "city": "Cairo",
    "district": "New Cairo",
    "address": "Building 12, Street 90",
    "description": "Street-facing retail space with strong visibility.",
    "amenities": ["PARKING", "SECURITY", "AC"],
    "numberOfFloors": 1,
    "floorNumber": 0,
    "availableFrom": "2026-09-01T00:00:00.000Z",
    "minimumLeaseTerm": "1 year",
    "annualRent": 600000,
    "annualRentWithVat": 690000,
    "currency": "EGP",
    "securityDepositMonths": 3,
    "status": "AVAILABLE",
    "media": [],
    "thumbnailUrl": "https://res.cloudinary.com/<cloud-name>/image/upload/...",
    "isSaved": true
  }
}
```

---

### 5.4 Get My Listings

- Method: GET
- Path: /api/v1/listings/my-listings
- Auth: Required
- Role: `landlord`

Success response:

```json
{
  "message": "success",
  "status": 200,
  "data": [
    {
      "id": "<listing-id>",
      "title": "Prime Retail Space",
      "category": "Retail",
      "areaSqm": 120,
      "annualRent": 600000,
      "currency": "EGP",
      "status": "PENDING",
      "thumbnailUrl": "https://res.cloudinary.com/<cloud-name>/image/upload/..."
    }
  ]
}
```

This endpoint powers the landlord My Listings table.

---

### 5.5 Update Listing

- Method: PUT
- Path: /api/v1/listings/:id
- Auth: Required
- Owner only

Request body can contain any listing fields to update:

```json
{
  "title": "Updated Retail Space",
  "annualRent": 650000
}
```

Success response:

```json
{
  "message": "Listing updated successfully",
  "status": 200,
  "data": {
    "id": "<listing-id>",
    "title": "Updated Retail Space",
    "annualRent": 650000,
    "annualRentWithVat": 747500
  }
}
```

---

### 5.6 Update Listing Status

- Method: PATCH
- Path: /api/v1/listings/:id/status
- Auth: Required
- Owner only

Request body:

```json
{
  "status": "AVAILABLE"
}
```

Allowed statuses:
- `PENDING`
- `AVAILABLE`
- `RENTED`
- `EXPIRED`

Success response:

```json
{
  "message": "Listing status updated successfully",
  "status": 200,
  "data": {
    "id": "<listing-id>",
    "status": "AVAILABLE"
  }
}
```

Notes:
- Manual publish stays.
- Create listing gives `PENDING`.
- Use this endpoint to publish by setting `AVAILABLE`.

---

### 5.7 Delete Listing

- Method: DELETE
- Path: /api/v1/listings/:id
- Auth: Required
- Owner only

Success response:

```json
{
  "message": "Listing deleted successfully",
  "status": 200
}
```

## 6) Media Endpoints

### 6.1 Upload Listing Photos

- Method: POST
- Path: /api/v1/listings/:id/media
- Auth: Required
- Owner only
- Content-Type: multipart/form-data

Form data:

```txt
photos: <file>
photos: <file>
```

Success response:

```json
{
  "message": "Listing media uploaded successfully",
  "status": 201,
  "data": {
    "id": "<listing-id>",
    "media": [
      {
        "_id": "<media-id>",
        "mediaType": "image",
        "url": "https://res.cloudinary.com/<cloud-name>/image/upload/...",
        "sortOrder": 0
      }
    ]
  }
}
```

Rules:
- Only PNG/JPG images are accepted.
- Max file size is 20MB per file.
- Minimum 3 photos is frontend guidance only; backend does not reject fewer than 3.

---

### 6.2 Reorder Listing Media

- Method: PUT
- Path: /api/v1/listings/:id/media/reorder
- Auth: Required
- Owner only

Request body:

```json
{
  "media": [
    {
      "mediaId": "<media-id>",
      "sortOrder": 0
    }
  ]
}
```

Success response:

```json
{
  "message": "Listing media reordered successfully",
  "status": 200,
  "data": {
    "id": "<listing-id>",
    "media": []
  }
}
```

---

### 6.3 Delete Listing Media

- Method: DELETE
- Path: /api/v1/listings/:id/media/:mediaId
- Auth: Required
- Owner only

Success response:

```json
{
  "message": "Listing media deleted successfully",
  "status": 200,
  "data": {
    "id": "<listing-id>",
    "media": []
  }
}
```

## 7) Saved Listings

### 7.1 Save Listing

- Method: POST
- Path: /api/v1/listings/:id/save
- Auth: Required

Success response:

```json
{
  "message": "Listing saved successfully",
  "status": 200
}
```

Notes:
- This endpoint is idempotent.
- Calling it twice should still return success.

---

### 7.2 Unsave Listing

- Method: DELETE
- Path: /api/v1/listings/:id/save
- Auth: Required

Success response:

```json
{
  "message": "Listing removed from saved listings",
  "status": 200
}
```

Notes:
- This endpoint is idempotent.
- Removing a listing that was not saved should still return success.

---

### 7.3 Get My Saved Listings

- Method: GET
- Path: /api/v1/users/me/saved-listings
- Auth: Required

Success response:

```json
{
  "message": "success",
  "status": 200,
  "data": [
    {
      "id": "<listing-id>",
      "title": "Prime Retail Space",
      "location": "New Cairo, Cairo",
      "annualRent": 600000,
      "annualRentWithVat": 690000,
      "currency": "EGP",
      "areaSqm": 120,
      "thumbnailUrl": "https://res.cloudinary.com/<cloud-name>/image/upload/...",
      "isSaved": true
    }
  ]
}
```

This endpoint powers the tenant Saved Listings grid.

## 8) Frontend Notes

### 8.1 City, district, and address
- `city` and `district` are required fields.
- They should be dropdowns in the Add Listing form.
- `address` should be street/building-level detail, not the full city/district.

### 8.2 Listing roles
- Creating and managing listings requires the user's `roles` array to include `landlord`.
- `activeRole` is only a UI preference and does not grant permissions.

### 8.3 Listing status flow
- New listing: `PENDING`
- Publish listing: call `PATCH /api/v1/listings/:id/status` with `AVAILABLE`
- Mark rented: call the same endpoint with `RENTED`
- Mark expired: call the same endpoint with `EXPIRED`

### 8.4 VAT
- Tenant-facing price should use `annualRentWithVat`.
- Backend computes this as `annualRent * 1.15`.
- Do not store or submit `annualRentWithVat` from the frontend.

### 8.5 Saved listing state
- Browse/detail endpoints can include `isSaved` if a valid token is sent.
- For anonymous browsing, `isSaved` may be absent.
- The Saved Listings screen should use `/api/v1/users/me/saved-listings`.

### 8.6 Media URLs
- Uploaded media returns full Cloudinary CDN URLs.
- Use the returned URL directly when rendering images in the frontend.

Example:

```txt
https://res.cloudinary.com/<cloud-name>/image/upload/...
```

## 9) Quick Integration Checklist

- Fetch `/api/v1/listings/meta` before rendering Add Listing.
- Build Add Listing form with required city and district dropdowns.
- Ensure landlord role exists before showing listing management actions.
- Create listing with `POST /api/v1/listings`.
- Publish listing with `PATCH /api/v1/listings/:id/status`.
- Use `/api/v1/listings/my-listings` for landlord table.
- Use `/api/v1/listings` for marketplace browsing and search.
- Use `/api/v1/listings/:id` for listing details.
- Upload photos with multipart field name `photos`.
- Use save/unsave endpoints for heart button behavior.
- Use `/api/v1/users/me/saved-listings` for the Saved Listings page.

