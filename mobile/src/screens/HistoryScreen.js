import React from 'react';

import { EmptyState, NativeScreen, Pill } from '../components/native/NativeLayout';

export default function HistoryScreen() {
  return (
    <NativeScreen
      eyebrow="Research Memory"
      title="History"
      subtitle="Your previous lookups, saved research, and S.A.L. conversations will collect here."
    >
      <Pill accent="purple">Personal research</Pill>
      <EmptyState
        showSal
        label="Nothing saved yet"
        detail="Ask S.A.L. or save research from the mobile app, then return here to pick up the thread."
      />
    </NativeScreen>
  );
}
