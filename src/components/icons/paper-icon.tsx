import type { FC } from 'react';

export const PaperIcon: FC<{ className?: string }> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 3v16.13a.25.25 0 0 0 .38.21l1.88-1.07a.25.25 0 0 1 .24 0l1.88 1.07a.25.25 0 0 0 .24 0l1.88-1.07a.25.25 0 0 1 .24 0l1.88 1.07a.25.25 0 0 0 .24 0l1.88-1.07a.25.25 0 0 1 .24 0l1.88 1.07a.25.25 0 0 0 .38-.21V3Z" />
    <path d="M5 3H3v18h18" />
  </svg>
);
