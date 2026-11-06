import AppSidebar from "@/components/common/app-sidebar";
import { getCurrentProfile } from "@/lib/profile";
import AuthStoreProvider from "@/providers/auth-store-provider";

// Server component: loads the signed-in user's profile, syncs it into the auth store
// (like website_cafe) and renders the sidebar.
export default async function AppSidebarLoader() {
  const profile = await getCurrentProfile();

  return (
    <AuthStoreProvider profile={profile}>
      <AppSidebar profile={profile} />
    </AuthStoreProvider>
  );
}
