import { useEffect, useRef, useState } from 'react';
import { batchGetTopicContent, generateTopic } from '../services/briefing.service';
import { emitJourneyEvent } from '../events/journeyEvents';
import type { BriefingDraft, TopicSection } from '../types';

export type SectionState =
  | { status: 'loading' }
  | { status: 'ready'; section: TopicSection }
  | { status: 'error' };

export interface BriefingAssembly {
  topicKeys: string[];
  sections: Record<string, SectionState>;
  doneCount: number;
  total: number;
  progress: number; // 0..1
  isComplete: boolean;
  retry: (topicKey: string) => void;
}

/**
 * Streaming assembly (spec §8.2): paint cached topics instantly, then generate
 * misses sequentially in order, dropping each in as it resolves.
 */
export function useBriefingAssembly(draft: BriefingDraft | null): BriefingAssembly {
  const topicKeys = draft?.topicKeys ?? [];
  const [sections, setSections] = useState<Record<string, SectionState>>({});
  const [doneCount, setDoneCount] = useState(0);
  const runIdRef = useRef(0);

  // stable signature so the effect only re-runs when the actual request changes
  const sig = draft
    ? `${draft.categorySlug}|${draft.countryCode}|${draft.subhubSlug ?? ''}|${draft.stage ?? ''}|${draft.who ?? ''}|${topicKeys.join(',')}`
    : '';

  useEffect(() => {
    if (!draft || !draft.countryCode || topicKeys.length === 0) return;
    const runId = ++runIdRef.current;
    let cancelled = false;

    setSections(Object.fromEntries(topicKeys.map((k) => [k, { status: 'loading' } as SectionState])));
    setDoneCount(0);

    (async () => {
      let done = 0;
      // 1) instant cache hits
      let hits: Record<string, TopicSection> = {};
      try {
        hits = await batchGetTopicContent(draft.categorySlug, draft.countryCode!, draft.subhubSlug, topicKeys);
      } catch {
        hits = {};
      }
      if (cancelled || runId !== runIdRef.current) return;
      if (Object.keys(hits).length) {
        setSections((prev) => {
          const next = { ...prev };
          for (const [k, s] of Object.entries(hits)) next[k] = { status: 'ready', section: s };
          return next;
        });
        done += Object.keys(hits).length;
        setDoneCount(done);
        for (const k of Object.keys(hits)) emitJourneyEvent('topic_cache_hit', { categorySlug: draft.categorySlug, countryCode: draft.countryCode, payload: { topicKey: k } });
      }

      // 2) sequential generation for misses, in order
      const misses = topicKeys.filter((k) => !hits[k]);
      for (const topicKey of misses) {
        if (cancelled || runId !== runIdRef.current) return;
        try {
          const section = await generateTopic({
            categorySlug: draft.categorySlug,
            countryCode: draft.countryCode!,
            subhubSlug: draft.subhubSlug,
            topicKey,
            stage: draft.stage,
            who: draft.who,
          });
          if (cancelled || runId !== runIdRef.current) return;
          setSections((prev) => ({ ...prev, [topicKey]: { status: 'ready', section } }));
          emitJourneyEvent('topic_generated', { categorySlug: draft.categorySlug, countryCode: draft.countryCode, payload: { topicKey, engine: section.engine, cache_hit: false } });
        } catch {
          if (cancelled || runId !== runIdRef.current) return;
          setSections((prev) => ({ ...prev, [topicKey]: { status: 'error' } }));
        }
        done += 1;
        setDoneCount(done);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const retry = (topicKey: string) => {
    if (!draft?.countryCode) return;
    setSections((prev) => ({ ...prev, [topicKey]: { status: 'loading' } }));
    generateTopic({
      categorySlug: draft.categorySlug,
      countryCode: draft.countryCode,
      subhubSlug: draft.subhubSlug,
      topicKey,
      stage: draft.stage,
      who: draft.who,
    })
      .then((section) => setSections((prev) => ({ ...prev, [topicKey]: { status: 'ready', section } })))
      .catch(() => setSections((prev) => ({ ...prev, [topicKey]: { status: 'error' } })));
  };

  const total = topicKeys.length;
  return {
    topicKeys,
    sections,
    doneCount,
    total,
    progress: total ? doneCount / total : 0,
    isComplete: total > 0 && doneCount >= total,
    retry,
  };
}
