import { environment } from "@/configs/environment";

import ContactLine from "./contact-line";
import { LegalDocument, LegalList, LegalSection } from "./legal-section";

// Draft for the owner to review: the operator name, contact and retention periods depend on the deployment.
export default function PrivacyPolicy() {
  const operator = environment.OPERATOR_NAME;

  return (
    <LegalDocument title="Privacy Policy">
      <LegalSection title="Who we are">
        <p>
          Kanbo is a kanban task manager for small teams. It is run by {operator} (&quot;we&quot;). This policy explains
          what data Kanbo handles, why, and what you can do about it.
        </p>
      </LegalSection>

      <LegalSection title="Data we collect">
        <LegalList
          items={[
            "From your Google account when you sign in: your name, email address and profile photo.",
            "What you add to your profile: username, headline, bio, location, website, time zone and an avatar you upload.",
            "What you and your team put in Kanbo: projects, columns, tasks, descriptions, assignees, due dates, member roles and who completed which task.",
            "Invitations: the email address that was invited. The invite link itself is stored only as a one-way hash, never in readable form.",
            "A session cookie that keeps you signed in. We do not use advertising or tracking cookies.",
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use it">
        <p>
          Only to run Kanbo: to sign you in, show your boards, send and accept invitations, calculate progress and
          statistics, and show your profile. We do not sell your data and we do not use it for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Google user data">
        <p>
          Kanbo&apos;s use of information received from Google follows the Google API Services User Data Policy,
          including its Limited Use requirements. Your Google name, email address and photo are used only to sign you in
          and to show your profile inside Kanbo. They are not shared for advertising and are not used to train models.
        </p>
      </LegalSection>

      <LegalSection title="Who can see your data">
        <LegalList
          items={[
            "Members of a project can see that project: its tasks, columns, members and their roles.",
            "People who share at least one active project with you can open your profile. You control what it shows (statistics, activity, pinned projects, recent tasks) in your profile settings.",
            "Nobody else can read your projects. Access is enforced in the database, not only in the interface.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Service providers">
        <p>To run Kanbo we rely on:</p>
        <LegalList
          items={[
            "Supabase, which stores the database, handles authentication and keeps uploaded avatars.",
            "A hosting provider that serves the application.",
            "Google, for signing in.",
          ]}
        />
        <p>They process data only to provide those services to us.</p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          We keep your data while your account exists. You can edit or remove your profile details and avatar at any
          time. To have your account and its personal data deleted, contact us; project content that belongs to a team
          may remain for the other members after your personal details are removed.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You may ask to see, correct, export or delete the personal data we hold about you, and you may object to how
          it is used. We will answer within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Data is sent over encrypted connections and protected by access rules in the database. No system is perfectly
          secure, so please use a strong Google account password and two-step verification.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Kanbo is not meant for children under 13, and we do not knowingly collect their data.</p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy. The date at the top shows the latest version; for significant changes we will tell
          you inside Kanbo.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <ContactLine />
      </LegalSection>
    </LegalDocument>
  );
}
