import { LlmGenerationRequest, LlmGenerationResult, LlmProvider } from './types.js';

/**
 * Deterministic, offline LLM provider.
 *
 * It composes a calm, grounded sentence strictly from the facts contained in the
 * prompt the companion built — it has no knowledge of its own and cannot invent
 * personal history. This makes it safe to use as the default when no external
 * provider credentials are available, and it keeps automated tests stable.
 *
 * The companion passes verified-memory facts inside a `<facts>...</facts>` block
 * in the final user message. The mock reads only that block.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';
  readonly model = 'mock-grounded-v1';
  readonly configured = true;

  async generate(request: LlmGenerationRequest): Promise<LlmGenerationResult> {
    const start = Date.now();
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user');
    const content = lastUser?.content ?? '';

    const factsMatch = content.match(/<facts>([\s\S]*?)<\/facts>/i);
    const nameMatch = content.match(/<patient>([\s\S]*?)<\/patient>/i);
    const firstName = (nameMatch?.[1] || '').trim();

    const facts = (factsMatch?.[1] || '')
      .split('\n')
      .map((line) => line.replace(/^[-*\s]+/, '').trim())
      .filter(Boolean);

    let text: string;
    if (facts.length === 0) {
      // No grounded facts were supplied. Never fabricate — defer honestly.
      text =
        "I don't have that memory in your family storybook yet. Perhaps someone in your family can tell us more.";
    } else {
      const greeting = firstName ? `${firstName}, ` : '';
      const detail = facts.slice(0, 2).join(' ');
      text = `${greeting}here is what your family has shared with me. ${detail} Would you like to look at the photos together?`.replace(
        /\s+/g,
        ' '
      ).trim();
    }

    return {
      text,
      provider: this.name,
      model: this.model,
      latencyMs: Date.now() - start
    };
  }
}
