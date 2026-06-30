'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  delay = 0,
}: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`rounded-2xl border border-gray-2 bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-dark-2 ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-dark dark:text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-body">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="text-dark dark:text-white">{children}</div>
    </motion.section>
  );
}
