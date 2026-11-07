import { environment } from "@/configs/environment";

// How to reach the operator: an email link when NEXT_PUBLIC_CONTACT_EMAIL is set.
export default function ContactLine() {
  const email = environment.CONTACT_EMAIL;
  return email ? (
    <p>
      Questions? Write to{" "}
      <a href={`mailto:${email}`} className="text-foreground underline underline-offset-[3px]">
        {email}
      </a>
      .
    </p>
  ) : (
    <p>Questions? Contact {environment.OPERATOR_NAME} through the channel it gave you when it invited you to Kanbo.</p>
  );
}
