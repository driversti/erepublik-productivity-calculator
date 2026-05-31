import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '../i18n';

// Unmount React trees between tests so queries never see a previous test's DOM.
afterEach(() => {
  cleanup();
});
