import type { FC } from 'react';

export const RockIcon: FC<{ className?: string }> = (props) => (
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
    <path d="M12.5 15.5C12.5 15.5 16 18 18 22" />
    <path d="M19.5 15.5C19.5 15.5 17.5 15 16 14" />
    <path d="M7 14a2 2 0 1 0-4 0v2a2 2 0 1 0 4 0Z" />
    <path d="M13.5 13.5C13.5 13.5 16 13 17 12" />
    <path d="M11 12a2 2 0 1 0-4 0v3a2 2 0 1 0 4 0Z" />
    <path d="M17 10a2 2 0 1 0-4 0v3a2 2 0 1 0 4 0Z" />
    <path d="M5 12a2 2 0 1 0-4 0v3a2 2 0 1 0 4 0Z" />
    <path d="M17.5 7.5C17.5 7.5 15.5 8 14 9" />
    <path d="M21 8a2 2 0 1 0-4 0v3a2 2 0 1 0 4 0Z" />
    <path d="m5.5 6.5 7-4.5" />
    <path d="M14 2c-2.5 0-2.5 2-4 3" />
    <path d="m20.5 3.5-6 4" />
  </svg>
);
