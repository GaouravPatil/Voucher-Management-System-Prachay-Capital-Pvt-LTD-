import { api, unwrap } from './client';
import type { User } from '../types';

export interface LoginResponse {
  token: string;
  expiresIn: string;
  user: User;
}

export const authApi = {
  login(email: string, password: string) {
    return unwrap<LoginResponse>(
      api.post('/auth/login', { email, password }),
    );
  },
  me() {
    return unwrap<User>(api.get('/auth/me'));
  },
  logout() {
    // Server endpoint exists for symmetry; client clears token regardless.
    return api.post('/auth/logout').catch(() => undefined);
  },

  // ---- Saved profile signature (Employee & Director) ----
  signatureStatus() {
    return unwrap<{ present: boolean; url: string | null }>(
      api.get('/users/me/signature'),
    );
  },
  uploadSignature(file: File) {
    const form = new FormData();
    form.append('signature', file);
    return unwrap<{ present: boolean; url: string | null }>(
      api.put('/users/me/signature', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  deleteSignature() {
    return api.delete('/users/me/signature');
  },
};

export const profileSignatureImageUrl = '/users/me/signature/image';
