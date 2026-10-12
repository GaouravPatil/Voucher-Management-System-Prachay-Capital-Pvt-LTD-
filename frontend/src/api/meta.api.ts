import { api, unwrap } from './client';
import type { MetaOptions } from '../types';

export const metaApi = {
  options() {
    return unwrap<MetaOptions>(api.get('/meta/options'));
  },
};
