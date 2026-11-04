PROJECT: MemoryBridge, a memory companion for people with dementia / early Alzheimer's.
It is a supportive tool, NOT a medical, diagnostic, or monitoring system. Never add medical claims.

HARD RULES
1. Never change the frontend's visual design, layout, copy, animations, routes, or navigation. Wiring to the backend is allowed; redesign is not.
2. The AI/companion must never invent personal memories. Factual answers use VERIFIED memories only.
   If nothing verified matches, reply exactly:
   "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more."
3. Every patient-specific endpoint must check the caller's access to that patient in a shared middleware/policy. Never trust patientId/userId from the client.
4. Never commit secrets. Only placeholders in .env.example. Never log passwords, tokens, memory text, or media URLs.
5. Private media is never served via public URLs. Use short-lived signed URLs.
6. Never claim something works unless you ran it and saw it pass. Show the command and its output.
7. Never silently delete or rewrite existing functionality. If you must replace something, say so in the plan.
8. If a credential or external service is missing, finish everything else, use mocks/emulators, and list exactly what the user must configure.
9. Commit after each completed phase with a clear message.