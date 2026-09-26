### Final Submission: Customer & Lead Manager

1. GitHub Repository Link:
https://github.com/Rakshi-byte-hub/intern-data-manager3

2. Live Vercel Website Link:
https://intern-data-manager3-git-main-rakshitha-81ab.vercel.app/

3. Summary of What I Learned:
- How HTML defines raw document structure, CSS controls visual presentation and layout, and JavaScript handles user interaction and client-side application state.
- How objects group related entity properties (e.g., name, email, company, status), and arrays manage collections of these entities.
- How the CRUD cycle functions end-to-end: Create (array.push), Read (array.filter and forEach DOM injection), Update (indexed array assignment), and Delete (array.splice).
- How localStorage provides persistent key-value storage in the browser, and why JSON.stringify() and JSON.parse() are mandatory for serializing and deserializing arrays and objects.
- How Git version control tracks code changes across atomic commits, and how GitHub integrates with Vercel via automated CI/CD webhooks to deploy changes on push.

4. Problems/Errors Faced and How I Solved Them:
- Problem: The webpage initially refreshed and lost form input values without adding data to the table.
  Solution: Added e.preventDefault() inside the form's submit event listener to override default HTML form submission behavior.
- Problem: JavaScript broke with syntax errors due to unclosed functions and unquoted string literals in innerHTML.
  Solution: Fixed all syntax boundaries, added template literal backticks (`` ` `) for interpolated strings, and placed `updateDashboard() into the correct functional scope.
- Problem: Editing a lead originally appended a duplicate row instead of modifying the existing one.
  Solution: Implemented a hidden input (edit-index) to track whether the form is in 'Create' mode (-1) or 'Update' mode (valid index), targeting the exact array position upon submission.
