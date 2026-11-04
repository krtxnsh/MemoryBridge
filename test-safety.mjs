import { conversationService } from './src/services/index.js';
import { INITIAL_MEMORIES, INITIAL_PEOPLE } from './src/data/mockData.js';

console.log("=== Testing MemoryBridge Safety Rules ===");

// 1. Test Verified Goa Query
const goaRes = conversationService.respond('Tell me about my Goa trip', INITIAL_MEMORIES, INITIAL_PEOPLE, 'Rajiv');
console.log("\n[Test 1] Goa Query:");
console.log("Response:", goaRes.text);
console.log("Has memoryCard:", !!goaRes.memoryCard);
if (!goaRes.text.includes("Goa in 1998") || !goaRes.memoryCard) {
  throw new Error("Test 1 Failed");
}

// 2. Test Unverified / Pending Memory Query (Nepal)
const nepalRes = conversationService.respond('Tell me about Kathmandu Nepal', INITIAL_MEMORIES, INITIAL_PEOPLE, 'Rajiv');
console.log("\n[Test 2] Pending Query (Nepal):");
console.log("Response:", nepalRes.text);
if (!nepalRes.text.includes("hasn't been confirmed yet")) {
  throw new Error("Test 2 Failed: Did not trigger pending safety response");
}

// 3. Test Unknown Memory Query (Paris)
const unknownRes = conversationService.respond('Tell me about my trip to Paris in 2010', INITIAL_MEMORIES, INITIAL_PEOPLE, 'Rajiv');
console.log("\n[Test 3] Unknown Query (Paris):");
console.log("Response:", unknownRes.text);
const expectedFallback = "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";
if (unknownRes.text !== expectedFallback) {
  throw new Error(`Test 3 Failed: Fallback was "${unknownRes.text}" instead of "${expectedFallback}"`);
}

// 4. Test Wedding Query
const weddingRes = conversationService.respond('What happened on my wedding day?', INITIAL_MEMORIES, INITIAL_PEOPLE, 'Rajiv');
console.log("\n[Test 4] Wedding Query:");
console.log("Response:", weddingRes.text);
if (!weddingRes.text.includes("November 22, 1985") || !weddingRes.text.includes("Anita")) {
  throw new Error("Test 4 Failed");
}

console.log("\n>>> ALL SAFETY TESTS PASSED SUCCESSFULLY! <<<");
