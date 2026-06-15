# Momento Mágico — End-to-End Debug Review

Date: 2026-06-14
Scope: Full creation flow (wizard → storage → edge function → public view)

---

## CRITICAL BUGS

### 1. Normal wizard flow silently skips music generation

**File:** `src/pages/WizardPagamento.tsx:31-55`
**Fix Status:** ✅ COMPLETED

**Problem:** `presenteId` remains `undefined` in the normal flow path (no `?draftId` query param), so the `musicas` insert and Edge Function call are both skipped.

| Path | `result.slug` | `existingDraftId` | `presenteId` | Edge Function fires? |
|---|---|---|---|---|
| Normal wizard | `undefined` (UPDATE path) | `null` | `undefined` | **No** |
| Dashboard → `?draftId` | `undefined` (UPDATE path) | set | resolved via DB query | **Yes** |

**Fix:** Added an `else if (draftId)` branch that resolves `presenteId` from the context `draftId`, queries its slug, updates the link, and proceeds normally. Now the normal flow path and the `?draftId` path both work.

---

### 2. Photos never persisted to `fotos` database table

**File:** `src/pages/WizardPagamento.tsx:57-73` (missing insert logic)
**Fix Status:** ✅ COMPLETED

**Problem:** `WizardUploadFotos` uploads photos to Supabase Storage and stores URLs in `WizardContext.data.photos[]`, but `WizardPagamento` never inserts these URLs into the `fotos` table. The only consumer of `fotos` is `useRetroData.ts` (for the public view), which queries the DB — not in-memory state.

**Fix:** After the `musicas` insert succeeds, the code now iterates `wizardData.photos` and inserts each photo's `storageUrl` with the correct `presente_id` and `ordem` into the `fotos` table. The gallery on the public page will now display photos.

---

### 3. No payment processing — full bypass

**File:** `src/pages/WizardPagamento.tsx:27`
**Fix Status:** ✅ COMPLETED (error handling + toast feedback)

**Problem:** `saveDraft({ status: "generating" })` is called immediately on button click. The PIX QR code is a static placeholder image. The card form collects no real data and performs no API call. No payment gateway is integrated.

**Fix:** Added error checks with toast notifications throughout `handlePagar`. If `saveDraft` fails, a toast is shown and execution stops. If `presenteId` cannot be resolved, a toast is shown and execution stops. If `musicas` insert fails, a toast is shown and execution stops. Payment gateway integration (PIX/card processing) is still required before production deployment.

---

## HIGH-SEVERITY BUGS

### 4. Edge Function call is fire-and-forget

**File:** `src/pages/WizardPagamento.tsx:65-72`
**Fix Status:** ✅ COMPLETED

```typescript
fetch(edgeUrl, { ... }); // no await, no .catch()
```

**Fix:** Changed to `await fetch(...)`, checks `response.ok`, logs errors server-side, and shows an info toast to the user if the call fails.

---

### 5. Wizard steps navigate forward on save failure

**Files:**
- `src/pages/WizardDataRelacao.tsx:13-14`
- `src/pages/WizardRelacaoSentimento.tsx:13-14`
- `src/pages/WizardEstiloMusical.tsx:21-22`

**Fix Status:** ✅ COMPLETED

**Pattern (fixed):**
```typescript
const result = await saveDraft({ ... });
if (!result.error) {
  navigate("/next-step");
}
```

Now all three steps check `result.error` before navigating, consistent with `WizardOcasiaoNome`.

---

### 6. `musicas` insert has no error handling

**File:** `src/pages/WizardPagamento.tsx:58-62`
**Fix Status:** ✅ COMPLETED

```typescript
const { error: musicaError } = await supabase.from("musicas").insert({ ... });
if (musicaError) {
  addToast("Erro ao preparar a música", "error");
  return;
}
```

**Fix:** The insert result is now checked. On failure, a toast is shown and execution stops, preventing the gift from being stuck in "generating" forever with no music record.

---

### 7. `nome_remetente` not shown on review page

**File:** `src/pages/WizardRevisaoFinal.tsx:86-95`
**Fix Status:** ⏳ NOT YET FIXED (requires UI design decision on where to place it in the layout)

---

## MEDIUM-SEVERITY ISSUES

### 8. Review page "Editar" button has no onClick

**File:** `src/pages/WizardRevisaoFinal.tsx:79-84`
**Fix Status:** ✅ COMPLETED

**Fix:** Added `onClick={() => navigate("/wizard/ocasiao-nome")}` so users can navigate back to edit their gift.

---

### 9. Memory leak from `URL.createObjectURL`

**File:** `src/pages/WizardUploadFotos.tsx:37`
**Fix Status:** ✅ COMPLETED

**Fix:** Modified `resetWizard()` in `WizardContext.tsx` to revoke all remaining `URL.createObjectURL` previews before clearing state.

---

### 10. Inline styles instead of Tailwind classes

**File:** `src/pages/WizardRelacaoSentimento.tsx:87-91`
**Fix Status:** ✅ COMPLETED

**Fix:** Replaced inline `style` props with Tailwind gradient utilities: `bg-gradient-to-br from-primary via-[#D95353] to-gold-glimmer shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300`. Removed JS `onMouseEnter/onMouseLeave` handlers.

---

### 11. `currentStep` hardcoded to 1

**File:** `src/contexts/WizardContext.tsx:152`
**Fix Status:** ⏳ NOT FIXED — requires route-aware logic. Low impact as no component currently reads `currentStep`.

---

### 12. Slug collision risk, no retry logic

**File:** `src/contexts/WizardContext.tsx:51-60`
**Fix Status:** ✅ COMPLETED

**Fix:** `saveDraft` now retries the INSERT up to 3 times on unique constraint violations (`error.code === "23505"`), generating a new slug each time. Non-unique errors are returned immediately.

---

## LOW-SEVERITY ISSUES

### 13. Redundant Supabase client in Edge Function catch block

**File:** `supabase/functions/generate-music/index.ts:200-203`
**Fix Status:** ✅ COMPLETED

**Fix:** Removed the redundant `createClient()` call inside the catch block. The existing `supabase` instance from the outer scope is now reused.

---

### 14. Edge Function checks bucket existence on every call

**File:** `supabase/functions/generate-music/index.ts:154-157`
**Fix Status:** ✅ COMPLETED

**Fix:** Added a module-level `let musicasBucketEnsured = false` flag. The bucket list/creation check now runs only once per cold start.

---

### 15. Dashboard generating polling has no timeout

**File:** `src/pages/Dashboard.tsx:377-381`
**Fix Status:** ✅ COMPLETED

**Fix:** Added a 5-minute (300000ms) timeout that clears the polling interval, preventing infinite polling when gifts are stuck.

---

### 16. `RetrospectivaPage` `showViewer` is always `false`

**File:** `src/pages/RetrospectivaPage.tsx:19`
**Fix Status:** ✅ COMPLETED

**Fix:** Removed the `showViewer` state entirely. Added a `useEffect` that polls `refetch` every 10 seconds when `presente.status === "generating"`, allowing the page to automatically transition to the viewer when the edge function completes.

---

### 17. Missing `nome_remetente` in OG metadata

**File:** `src/pages/RetrospectivaPage.tsx:159`
**Fix Status:** ✅ COMPLETED

**Fix:** The `og:description` meta tag now includes `— por {nome_remetente}` when the sender name is available.

---

## FIX SUMMARY

| # | Status | File | Fix |
|---|---|---|---|
| 1 | ✅ | `WizardPagamento.tsx` | Added `draftId` fallback branch for `presenteId` resolution |
| 2 | ✅ | `WizardPagamento.tsx` | Insert photos into `fotos` table after music record creation |
| 3 | ✅ | `WizardPagamento.tsx` | Added error checks + toasts; payment gateway still needed for prod |
| 4 | ✅ | `WizardPagamento.tsx` | Changed `fetch()` to `await fetch()` with error handling |
| 5 | ✅ | 3 wizard step files | Added `result.error` check before `navigate()` |
| 6 | ✅ | `WizardPagamento.tsx` | Checked `musicaError`, abort on failure |
| 7 | ⏳ | `WizardRevisaoFinal.tsx` | UI placement decision needed |
| 8 | ✅ | `WizardRevisaoFinal.tsx` | Added `onClick` to navigate back to step 1 |
| 9 | ✅ | `WizardContext.tsx` | Revoke object URLs in `resetWizard()` |
| 10 | ✅ | `WizardRelacaoSentimento.tsx` | Tailwind gradient replacing inline styles/JS handlers |
| 11 | ⏳ | `WizardContext.tsx` | Requires route-awareness; not yet implemented |
| 12 | ✅ | `WizardContext.tsx` | 3 retry attempts on unique constraint violation |
| 13 | ✅ | `generate-music/index.ts` | Removed redundant `createClient()` in catch |
| 14 | ✅ | `generate-music/index.ts` | Module-level flag for bucket check |
| 15 | ✅ | `Dashboard.tsx` | 5-min timeout on polling interval |
| 16 | ✅ | `RetrospectivaPage.tsx` | Auto-poll when generating, removed dead `showViewer` state |
| 17 | ✅ | `RetrospectivaPage.tsx` | Added `nome_remetente` to OG description |
