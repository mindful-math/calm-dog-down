# Developer Guide: Dog Calm-Down

## UI Development Patterns

The frontend is a vanilla JS SPA. To maintain consistency and low complexity, follow these patterns:

### Adding a New UI Element (e.g., a Button)
1. **HTML**: Add the element to `index.html` with a unique `id`. Use existing CSS classes (`.card`, `.row`, `.primary`, `.danger`) for styling.
2. **State**: If the element tracks data, add a property to the global state object `S` in the `<script>` section.
3. **Logic**: 
   - Add an event listener: `document.getElementById('myBtn').onclick = () => { ... };`
   - Update state `S`.
   - Call the relevant `update...UI()` function to reflect changes.

### Styling
- **Theming**: Use CSS variables defined in `:root` (e.g., `var(--accent)`, `var(--border)`).
- **Layout**: Use `.row` and `.col` for basic flexbox alignment.

## Architecture & State

### Frontend State (`S` object)
All volatile application state is stored in the `S` object. 
- **Persistence**: Use `localStorage.setItem('key', JSON.stringify(value))` for data that must survive page reloads (e.g., `barkLog`, `banditState`).
- **UI Sync**: Always update the state first, then trigger a UI refresh function.

### Backend Endpoints
The server is a native Node.js `http` server. To add a new endpoint:
1. Locate the `http.createServer` block in `server.js`.
2. Add a new conditional block:
   ```javascript
   if (req.method === 'POST' && req.url === '/new-endpoint') {
     // 1. Parse body
     // 2. Execute logic
     // 3. res.writeHead(200); res.end(JSON.stringify({ ok: true }));
     return;
   }
   ```

## Testing & Quality

### TDD Approach
As per `.clinerules/coding.md`, follow a Test-Driven Development approach:
1. **Write a test** for the new functionality (Integration or Unit).
2. **Implement** the minimum code to pass the test.
3. **Refactor** for simplicity.

### Verification
- **Frontend**: Use Browser DevTools (Console/Network) to verify state changes and API calls.
- **Backend**: Use `curl` or a tool like Postman to test endpoints.

### Running Tests
The project uses **Jest** for unit testing core logic (e.g., the Bandit algorithm).

**Local Execution:**
1. Install dependencies: `npm install`
2. Run all tests: `npm test`
3. Run a specific test file: `npx jest bandit.test.js`
4. Run tests with history logging: `npm run test:log`

**Docker Execution:**
To run tests inside the container environment:
```bash
docker run --rm dog-calm-down npm test
```

### Test History
Test results are persisted in `tests.log` when using the `test:log` script. This file is git-ignored and contains timestamps, full output, and a final PASS/FAIL status for each run.

## Coding Standards

### General Practices
- **KISS**: "Less is more." Avoid over-engineering. Prefer simple functions over complex abstractions.
- **Casing**: 
    - Variables/Functions: `camelCase`
    - Constants: `UPPER_SNAKE_CASE`
    - State Object: `S` (Global)
- **Documentation**: Update the Memory Bank (`memory-bank/`) after every significant iteration.

### Git Commits
Follow the [Conventional Commits](https://conventionalcommits.org/) specification as defined in `.clinerules/commit-description.md`:
- `feat: add xai phrase suggestions`
- `fix: resolve voice clone audio blob leak`
- `docs: update system patterns diagram`
- `test: add unit test for bandit reward logic`

## Quick Start for Devs
1. `npm install`
2. Set environment variables in `.env` (SMTP, API Keys).
3. `node server.js`
4. Open `index.html` in Chrome/Edge.