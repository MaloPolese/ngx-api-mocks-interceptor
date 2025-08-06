1. Request Matching Enhancements:

- [x] Add support for more flexible URL matching patterns (regex, wildcards)
- [x] Allow matching on request headers, query parameters

2. Response Configuration:

- [-] Add ability to return different responses based on request count
- [x] Support streaming responses

3. Developer Experience:

- [ ] Add logging/debugging options to see which mocks are being hit
- [ ] Create a standalone mode that doesn't require Angular

4. Testing Support:

- [ ] Add helpers for integration testing
- [ ] Provide ways to verify which mocks were called
- [ ] Support recording/playback of real API responses

5. Persistence:

- [ ] Allow saving/loading mock configurations
- [ ] Support importing from OpenAPI/Swagger specs
- [ ] Enable sharing mock configs between team members

6. Advanced Features:

- [ ] Support WebSocket mocking
- [ ] Add proxy mode to selectively mock certain endpoints while passing through others
- [ ] Enable stateful mocks that can maintain data between requests
- [ ] Support scenarios/sequences of related requests
