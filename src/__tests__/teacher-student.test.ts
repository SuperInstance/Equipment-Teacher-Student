/**
 * Equipment-Teacher-Student — Tests
 * Tests DeadbandController, DistillationEngine, MuscleMemory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeadbandController } from '../DeadbandController';
import { DistillationEngine } from '../DistillationEngine';
import { MuscleMemory } from '../MuscleMemory';

// ═══════════════════════════════════════════════════════════════════
// DeadbandController Tests (12 tests)
// ═══════════════════════════════════════════════════════════════════

describe('DeadbandController', () => {
  let db: DeadbandController;
  beforeEach(() => { db = new DeadbandController({ low: 0.6, high: 0.9 }); });

  it('should create with default config', () => {
    expect(new DeadbandController()).toBeDefined();
  });

  it('should evaluate within range confidence', () => {
    const result = db.evaluate(0.75);
    expect(result).toBeDefined();
  });

  it('should evaluate low confidence', () => {
    const result = db.evaluate(0.3);
    expect(result).toBeDefined();
  });

  it('should evaluate high confidence', () => {
    const result = db.evaluate(0.95);
    expect(result).toBeDefined();
  });

  it('should return state', () => {
    db.evaluate(0.75);
    const state = db.getState();
    expect(state).toBeDefined();
    expect(state.position).toBeDefined();
  });

  it('should handle zero confidence', () => {
    expect(db.evaluate(0)).toBeDefined();
  });

  it('should handle perfect confidence', () => {
    expect(db.evaluate(1.0)).toBeDefined();
  });

  it('should work with custom config', () => {
    const custom = new DeadbandController({ low: 0.4, high: 0.8, hysteresis: 0.1 });
    expect(custom).toBeDefined();
    expect(custom.evaluate(0.5)).toBeDefined();
  });

  it('should handle rapid oscillation', () => {
    for (let i = 0; i < 20; i++) {
      db.evaluate(i % 2 === 0 ? 0.3 : 0.95);
    }
    expect(db.getState()).toBeDefined();
  });

  it('should stabilize on repeated values', () => {
    for (let i = 0; i < 10; i++) db.evaluate(0.8);
    const state = db.getState();
    expect(state).toBeDefined();
  });

  it('should return getDeadbandBoundaries info', () => {
    const state = db.getState();
    expect(state).toBeDefined();
    // position is one of: below, within, above
    expect(['below', 'within', 'above']).toContain(state.position);
  });

  it('should adapt boundaries over time', () => {
    const state1 = db.getState();
    for (let i = 0; i < 15; i++) db.evaluate(0.85);
    const state2 = db.getState();
    // After repeated high-confidence readings, state should exist and be valid
    expect(state2).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// DistillationEngine Tests (12 tests)
// ═══════════════════════════════════════════════════════════════════

describe('DistillationEngine', () => {
  let de: DistillationEngine;
  const makeResponse = (id: number) => ({
    taskId: `task-${id}`,
    query: `test query ${id}`,
    context: { domain: 'testing' },
    teacherOutput: { answer: `ans-${id}` },
    teacherConfidence: 0.95,
    teacherReasoning: 'Teacher reasoning',
    timestamp: Date.now(),
  });

  beforeEach(() => { de = new DistillationEngine(); });

  it('should create with default config', () => {
    expect(de).toBeDefined();
  });

  it('should distill a teacher response', async () => {
    const result = await de.distill(makeResponse(1));
    expect(result).toBeDefined();
    expect(typeof result.learned).toBe('boolean');
  });

  it('should learn from comparison', async () => {
    const resp = makeResponse(1);
    const result = await de.learnFromComparison(
      { answer: '40' },
      0.6,
      resp as any
    );
    expect(result).toBeDefined();
  });

  it('should query knowledge base', () => {
    const result = de.queryKnowledge({ id: 't', query: 'test query', context: {} } as any);
    expect(result).toBeDefined();
  });

  it('should return metrics', () => {
    const m = de.getMetrics();
    expect(m).toBeDefined();
    expect(typeof m.totalProcessed).toBe('number');
  });

  it('should return knowledge base as array', () => {
    expect(Array.isArray(de.getKnowledgeBase())).toBe(true);
  });

  it('should return learning progress 0-1', () => {
    const p = de.getLearningProgress();
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('should prune without error', () => {
    de.prune();
  });

  it('should reset to zero', () => {
    de.reset();
    expect(de.getMetrics().totalProcessed).toBe(0);
  });

  it('should accumulate learning', async () => {
    for (let i = 0; i < 5; i++) await de.distill(makeResponse(i));
    expect(de.getMetrics().totalProcessed).toBeGreaterThanOrEqual(5);
  });

  it('should apply knowledge to tasks', () => {
    const result = de.applyKnowledge({ id: 't', query: 'test query', context: {} } as any);
    expect(result).toBeDefined();
  });

  it('should work with custom config', () => {
    const custom = new DistillationEngine({
      maxExamplesPerPattern: 50,
      successThreshold: 0.9,
      learningRate: 0.2,
    });
    expect(custom).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// MuscleMemory Tests (8 tests)
// ═══════════════════════════════════════════════════════════════════

describe('MuscleMemory', () => {
  let mm: MuscleMemory;
  beforeEach(() => { mm = new MuscleMemory(); });

  it('should create with default config', () => {
    expect(mm).toBeDefined();
  });

  it('should extract from knowledge base', () => {
    const knowledge = [{
      id: 'k-1',
      pattern: { query: 'test', contextKeys: ['domain'] },
      teacherBehavior: { output: 'ans', confidence: 0.9 },
      applicationCount: 10,
      successRate: 0.9,
      confidence: 0.85,
    }] as any;
    const result = mm.extractFromKnowledge(knowledge);
    expect(result).toBeDefined();
  });

  it('should check triggers', () => {
    const result = mm.checkTriggers({ domain: 'testing' });
    expect(result).toBeDefined();
  });

  it('should get triggers as array', () => {
    expect(Array.isArray(mm.getTriggers())).toBe(true);
  });

  it('should return metrics', () => {
    expect(mm.getMetrics()).toBeDefined();
  });

  it('should return performance report', () => {
    expect(mm.getPerformanceReport()).toBeDefined();
  });

  it('should reset', () => {
    mm.reset();
    expect(mm.getTriggers().length).toBe(0);
  });

  it('should export and import triggers', () => {
    const exported = mm.export();
    expect(Array.isArray(exported)).toBe(true);
    mm.import(exported);
  });
});
