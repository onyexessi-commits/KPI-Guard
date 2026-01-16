
import React from 'react';
import NewKpiGuard from './NewKpiGuard';

/**
 * KPI Guard App Entry
 * Используется NewKpiGuard для изолированного локального расчёта и аудита.
 */
export default function App() {
  return (
    <NewKpiGuard />
  );
}
