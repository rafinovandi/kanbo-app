import LoginForm from "./login-form";
import LoginVisual from "./login-visual";

// Sign In · Variant B (Grid). Desktop: illustration on the left, form on the right.
// Mobile: form only. The breakpoint is CSS (`md` = 768px, same as useIsMobile) so the server
// renders the right layout with no flash.
export default function Login() {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="hidden min-w-0 flex-[1_1_560px] p-4 md:flex">
        <LoginVisual />
      </div>
      <LoginForm />
    </div>
  );
}
