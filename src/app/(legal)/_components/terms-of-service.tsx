import { environment } from "@/configs/environment";

import ContactLine from "./contact-line";
import { LegalDocument, LegalList, LegalSection } from "./legal-section";

// Draft for the owner to review: the operator name, contact and governing law depend on the deployment.
export default function TermsOfService() {
  const operator = environment.OPERATOR_NAME;

  return (
    <LegalDocument title="Terms of Service">
      <LegalSection title="Acceptance">
        <p>
          By signing in to or using Kanbo, run by {operator} (&quot;we&quot;), you agree to these terms and to our
          Privacy Policy. If you do not agree, please do not use Kanbo.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You sign in with your Google account. You are responsible for what happens under your account, so keep it
          secure. You must be at least 13 years old, and old enough to agree to these terms where you live.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          What you and your team put into Kanbo (projects, tasks, descriptions and so on) stays yours. You give us
          permission to store and show it only as needed to run the service. You are responsible for having the right to
          share it.
        </p>
      </LegalSection>

      <LegalSection title="Projects and roles">
        <LegalList
          items={[
            "The person who creates a project is its creator and an admin; the creator cannot be removed from it.",
            "Admins can invite and remove members, change roles, add, edit and delete columns, and delete tasks.",
            "Every member can create, edit and move tasks and assign people. Leaving or being removed ends your access to that project.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "break the law or use Kanbo for unlawful or harmful content;",
            "try to access projects or data that are not yours, or probe the service for weaknesses without our permission;",
            "disrupt Kanbo, overload it, or interfere with other people using it;",
            "impersonate someone else or send unwanted invitations.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You can stop using Kanbo at any time and ask us to delete your account. We may suspend or close accounts that
          break these terms or put the service or other people at risk.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer and liability">
        <p>
          Kanbo is provided &quot;as is&quot;, without warranties of any kind. We do not promise it will always be
          available or free of errors. To the extent the law allows, we are not liable for indirect or consequential
          losses, or for loss of data or profits arising from using Kanbo. Please keep your own copies of anything
          important.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may change these terms. The date at the top shows the latest version. If you keep using Kanbo after a
          change, you accept the new terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of the place where {operator} is based, unless the law where you live
          says otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <ContactLine />
      </LegalSection>
    </LegalDocument>
  );
}
