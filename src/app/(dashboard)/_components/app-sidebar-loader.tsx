import AppSidebar from "@/components/common/app-sidebar";
import { getCurrentProfile } from "@/lib/profile";
import { getMyProjects } from "@/lib/projects";
import AuthStoreProvider from "@/providers/auth-store-provider";

// Server component: loads the signed-in user's profile, syncs it into the auth store
// and renders the sidebar. The profile goes first: it checks the session
// (and redirects to sign in) before any project data is read.
export default async function AppSidebarLoader() {
  const profile = await getCurrentProfile();
  const projects = await getMyProjects();

  return (
    <AuthStoreProvider profile={profile}>
      <AppSidebar profile={profile} projects={projects} />
    </AuthStoreProvider>
  );
}
