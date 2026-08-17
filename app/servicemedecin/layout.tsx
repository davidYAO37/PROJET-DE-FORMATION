import RoleGuard from '@/components/RoleGuard';

export default function ServiceMedecinLegacyLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['medecin', 'admin']}>{children}</RoleGuard>;
}
