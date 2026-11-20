import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  LocalSemanticEmbeddingProvider
} from '../src/services/embedding.service.js';

describe('Local semantic embedding provider', () => {
  const provider = new LocalSemanticEmbeddingProvider();

  it('creates normalized vectors with a stable dimension', async () => {
    const vector = await provider.embed('Graduation day at university');
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    expect(vector).toHaveLength(256);
    expect(magnitude).toBeCloseTo(1, 8);
  });

  it('normalizes paraphrases for places and family relationships', async () => {
    const query = await provider.embed('seaside with my daughter');
    const memory = await provider.embed('beach picnic with Riya, father and daughter');
    expect(cosineSimilarity(query, memory)).toBeGreaterThan(0.5);
  });

  it('keeps unrelated topics below the retrieval threshold', async () => {
    const query = await provider.embed('weather forecast and rainfall tomorrow');
    const memory = await provider.embed('wedding ceremony with family in Jaipur');
    expect(cosineSimilarity(query, memory)).toBeLessThan(0.24);
  });
});
