# MemoryBridge — Design Diagrams

System architecture, entity-relationship model, use cases, and the companion
data flow. Diagrams use Mermaid (rendered by GitHub).

## 1. System architecture

```mermaid
flowchart TB
    subgraph Client["Client (React + Vite)"]
      CG["Caregiver web app<br/>/family/*"]
      PT["Patient tablet app<br/>/patient/*"]
      AC["AppContext<br/>(source-of-truth state,<br/>optimistic + rollback)"]
      API["API client<br/>({data,error} envelope,<br/>token + refresh)"]
      CG --- AC
      PT --- AC
      AC --- API
    end

    API -->|HTTPS /api/v1<br/>Bearer JWT / tablet token| EXP

    subgraph Server["Backend (Express + TypeScript)"]
      EXP["Routes → Controllers"]
      MW["Middleware<br/>auth · access-control · validation ·<br/>rate-limit · CSRF · error handler"]
      SVC["Services (domain logic)"]
      REPO["Repositories (Prisma)"]
      EXP --> MW --> SVC --> REPO

      subgraph Providers["Swap-ready providers (env-selected, keys backend-only)"]
        EMB["Embedding<br/>local_semantic"]
        LLM["LLM<br/>none·mock·openai·anthropic"]
        VIS["Image description<br/>none·mock·openai"]
        STO["Storage<br/>local·firebase·mock"]
      end
      SVC --> EMB
      SVC --> LLM
      SVC --> VIS
      SVC --> STO
    end

    REPO --> DB[("PostgreSQL")]
    STO --> OBJ[("Private object storage<br/>signed upload/read URLs")]
    LLM -.optional.-> EXT["External LLM API"]
    VIS -.optional.-> EXT
```

**Layering**: Routes → Controllers → Services → Repositories (Prisma). Every
personal fact crosses the verification gate in the service layer; the client
cannot override it. Providers are interfaces chosen at runtime by environment
variables, so the system runs fully offline (mock/local) or against external
services without code changes.

## 2. Entity-relationship diagram

```mermaid
erDiagram
    User ||--o{ PatientAccess : has
    PatientProfile ||--o{ PatientAccess : grants
    User ||--o{ RefreshToken : owns
    PatientProfile ||--o| Person : "self-person"

    PatientProfile ||--o{ Memory : contains
    PatientProfile ||--o{ Album : contains
    PatientProfile ||--o{ Person : contains
    PatientProfile ||--o{ Relationship : contains
    PatientProfile ||--o{ Storybook : contains
    PatientProfile ||--o{ RoutineItem : contains
    PatientProfile ||--o{ DiaryEntry : contains
    PatientProfile ||--o{ Conversation : contains
    PatientProfile ||--o{ Media : contains
    PatientProfile ||--o{ PatientInvitation : issues
    PatientProfile ||--o{ PatientSession : "tablet sessions"

    User ||--o{ Memory : "created / approved"
    Album ||--o{ Memory : groups
    Memory ||--o{ MemoryPeople : tags
    Person ||--o{ MemoryPeople : "appears in"
    Memory ||--o{ Media : "has"
    Memory ||--o{ Verification : "review history"
    User ||--o{ Verification : performs

    Storybook ||--o{ StorybookMemories : orders
    Memory ||--o{ StorybookMemories : "included in"

    Person ||--o{ Relationship : "person one"
    Person ||--o{ Relationship : "person two"

    Conversation ||--o{ Message : contains
    Memory ||--o{ Message : "supports (grounding)"

    Media ||--o| MediaUpload : "upload intent"
    PatientInvitation }o--|| User : "creator / redeemer"
    PatientProfile ||--o{ AuditLog : records
```

Key integrity rules enforced in schema + services:
- A `Memory` starts `PENDING`; `verificationStatus` gates all patient/viewer reads.
- `Media.aiDescription*` (AI-suggested) is stored apart from `Media.caption`
  (family text) and is not patient-visible until approved.
- `Message.relatedMemoryId` + `retrievalScore` make each companion answer traceable.
- `Relationship` is unique on `(patient, personOne, personTwo, type)`.

## 3. Use-case diagram

```mermaid
flowchart LR
    owner(("Owner /<br/>Caregiver"))
    family(("Family<br/>contributor"))
    viewer(("Viewer"))
    patient(("Patient"))

    subgraph Caregiver_App["Caregiver / family web app"]
      u1["Create patient workspace"]
      u2["Invite family (expiring code)"]
      u3["Add people & relationships"]
      u4["Create / edit memory"]
      u5["Upload private media"]
      u6["Verify / reject memory"]
      u7["Curate albums & storybooks"]
      u8["Review AI image description"]
      u9["Manage family access"]
    end

    subgraph Patient_App["Patient tablet app"]
      p1["Browse verified memories"]
      p2["Ask companion (text/voice)"]
      p3["Confirm voice transcript"]
      p4["Play music / view family"]
    end

    owner --- u1 & u2 & u3 & u4 & u5 & u6 & u7 & u8 & u9
    family --- u3 & u4 & u5
    viewer --- p1
    patient --- p1 & p2 & p3 & p4

    u6 -. "unlocks" .-> p1
    u6 -. "unlocks" .-> p2
```

The verification use case (u6) is the hinge: only after a caregiver verifies does
content become visible to the patient (p1) and available to the companion (p2).

## 4. Companion recall — data flow

```mermaid
sequenceDiagram
    participant P as Patient (tablet)
    participant API as API /companion/message
    participant EMB as Embedding retrieval
    participant DB as PostgreSQL
    participant LLM as LLM provider (optional)

    P->>API: question (text or confirmed transcript)
    API->>EMB: embed(question)
    EMB->>DB: SELECT memories WHERE status = VERIFIED
    DB-->>EMB: verified memories only
    EMB-->>API: top matches ≥ threshold & coverage (or none)
    alt no match
        API-->>P: exact safe fallback (LLM NOT called)
    else verified match
        API->>LLM: rephrase ONLY these facts (timeout; grounded prompt)
        LLM-->>API: warm phrasing (or error → deterministic reply)
        API->>DB: save turn (relatedMemoryId, retrievalScore)
        API-->>P: answer + memory card + provenance
    end
```

This is the core guarantee in one picture: pending memories never enter
retrieval, and the LLM is invoked only when verified facts exist — so it can
phrase but never invent.
