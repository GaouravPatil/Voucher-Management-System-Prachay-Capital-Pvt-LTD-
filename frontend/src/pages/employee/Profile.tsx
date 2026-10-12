import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Trash2, Upload } from 'lucide-react';
import { authApi, profileSignatureImageUrl } from '../../api/auth.api';
import { apiErrorMessage } from '../../api/client';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { ImageUploader } from '../../components/ui/ImageUploader';
import { SecureImage } from '../../components/ui/SecureImage';
import { Skeleton } from '../../components/ui/Skeleton';

export function EmployeeProfile() {
  return <ProfilePage title="My Profile" subtitle="Manage your details and saved signature." />;
}

export function ProfilePage({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const sigQuery = useQuery({
    queryKey: ['my-signature'],
    queryFn: authApi.signatureStatus,
  });

  const uploadMutation = useMutation({
    mutationFn: (f: File) => authApi.uploadSignature(f),
    onSuccess: () => {
      toast.success('Signature saved.');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-signature'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to upload signature.')),
  });

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteSignature,
    onSuccess: () => {
      toast.success('Saved signature removed.');
      queryClient.invalidateQueries({ queryKey: ['my-signature'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e, 'Failed to remove signature.')),
  });

  const present = !!sigQuery.data?.present;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>

      <Card>
        <CardHeader title="Account" />
        <CardBody>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
              <dd className="text-sm text-gray-900">{user?.role ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Employee ID</dt>
              <dd className="text-sm text-gray-900">{user?.employeeCode || '—'}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Saved Signature"
          subtitle="Used to pre-fill the signature on new vouchers. Changing it never alters old vouchers (snapshots)."
        />
        <CardBody>
          {sigQuery.isLoading ? (
            <div role="status" aria-label="Loading signature">
              <Skeleton className="h-24 w-full" />
              <span className="sr-only">Loading…</span>
            </div>
          ) : sigQuery.isError ? (
            <ErrorState
              message={apiErrorMessage(sigQuery.error, 'Failed to load signature.')}
              onRetry={() => sigQuery.refetch()}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current saved signature
                </p>
                <div className="mt-1">
                  <SecureImage
                    url={present ? profileSignatureImageUrl : null}
                    alt="My saved signature"
                  />
                </div>
              </div>
              <ImageUploader
                label="Upload new signature"
                value={file}
                onChange={setFile}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!file || uploadMutation.isPending}
                  loading={uploadMutation.isPending}
                  onClick={() => file && uploadMutation.mutate(file)}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {present ? 'Replace signature' : 'Save signature'}
                </Button>
                {present && (
                  <Button
                    variant="secondary"
                    disabled={deleteMutation.isPending}
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
