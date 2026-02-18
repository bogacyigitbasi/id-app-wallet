Design or review API endpoints following REST/GraphQL best practices.

## Process

1. **Gather Requirements**
   - What resources are being exposed?
   - What operations are needed (CRUD, custom actions)?
   - Who are the consumers (web, mobile, third-party)?
   - What's the expected load/scale?

2. **REST API Design** (if applicable)

   **Resource Naming**
   - [ ] Nouns for resources (users, orders, not getUsers)
   - [ ] Plural for collections (/users not /user)
   - [ ] Nested for relationships (/users/:id/orders)
   - [ ] kebab-case for multi-word (/user-profiles)

   **HTTP Methods**
   - GET: Read (idempotent, cacheable)
   - POST: Create (not idempotent)
   - PUT: Full update (idempotent)
   - PATCH: Partial update (idempotent)
   - DELETE: Remove (idempotent)

   **Status Codes**
   - 200 OK, 201 Created, 204 No Content
   - 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
   - 422 Unprocessable Entity (validation)
   - 429 Too Many Requests (rate limit)
   - 500 Internal Server Error

3. **Request/Response Design**

   **Request**
   ```json
   {
     "data": { /* payload */ },
     "meta": { "requestId": "uuid" }
   }
   ```

   **Response**
   ```json
   {
     "data": { /* or [] for collections */ },
     "meta": { "page": 1, "limit": 20, "total": 100 },
     "errors": [{ "code": "ERR_001", "message": "...", "field": "email" }]
   }
   ```

4. **API Security**
   - [ ] Authentication method (JWT, OAuth2, API key)
   - [ ] Authorization (RBAC, ABAC, scopes)
   - [ ] Rate limiting strategy
   - [ ] Input validation on all endpoints
   - [ ] No sensitive data in URLs (use body/headers)
   - [ ] CORS configured correctly
   - [ ] HTTPS enforced

5. **Documentation**
   - [ ] OpenAPI/Swagger spec
   - [ ] Request/response examples
   - [ ] Error code documentation
   - [ ] Versioning strategy (URL: /v1, header, query)

6. **Output**
   Generate:
   - OpenAPI 3.0 spec (YAML)
   - TypeScript types for request/response
   - Example curl commands
   - Migration notes if changing existing API

$ARGUMENTS
