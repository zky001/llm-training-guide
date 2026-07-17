import React, {type ReactNode} from 'react';
import {LearningModeProvider, LearningModeFab} from '@site/src/components/LearningMode';

export default function Root({children}: {children: ReactNode}) {
  return (
    <LearningModeProvider>
      {children}
      <LearningModeFab />
    </LearningModeProvider>
  );
}
