# MemoryBridge — 5-Minute Demonstration Script

Goal: show the core contribution — **the AI never invents a person's past; it
speaks only from family-verified memories, and every answer is traceable.**

Setup: run `npm run test:e2e` once (seeds the demo workspace), or start the API
and `npm run dev`, then open the app. Demo accounts: `anita@example.com` /
`Password123!` (caregiver), `riya@example.com` (family).

| Time | Scene | What to show | The point |
| --- | --- | --- | --- |
| 0:00 | Landing | Click **Try Caregiver Demo**. | One backend, two apps. |
| 0:30 | Family access | Open **Family Access** → create an expiring invite code. | Governed, time-limited sharing. |
| 1:00 | New memory | Open the **storybook wizard**, add a title/photo, save. Point out the badge: **Pending Verification**. | Nothing is trusted until a human approves it. |
| 1:45 | Patient can't see it | Switch to the **Patient app** → it is **not** shown. | Unverified content is invisible to the patient. |
| 2:15 | Verify | Back in caregiver, **verify** the memory (or an AI image-description draft → **approve**). | The human gate; AI drafts never reach the patient unapproved. |
| 2:45 | Patient sees it | Patient app now shows the verified memory. | Verification unlocks visibility. |
| 3:15 | Companion recall | In **Talk to Mira**, ask about that memory (voice: confirm the transcript first). Mira answers from the verified fact and shows the photo. | Grounded recall + provenance + transcript safety. |
| 4:00 | Honesty | Ask something unknown ("What's the weather?"). Mira replies with the **exact safe fallback**. | The AI openly says when it doesn't know — no invention. |
| 4:30 | Trust & access | Refresh (everything persists). Note a different account cannot open this patient. Toggle **high contrast**. | Persistence, isolation, accessibility. |
| 5:00 | Close | "Every personal fact came from a verified family memory, and every answer was traceable to its record." | The contribution, in one line. |

Fallbacks if offline: the companion still returns grounded/fallback replies with
the `mock` LLM; media uses the `local` provider; all data is in PostgreSQL.
