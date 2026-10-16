import 'client-only';
import { createApiClient } from './client';

export const browserApi = createApiClient('/api');
