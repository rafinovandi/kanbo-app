import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CTA_BUTTON_CLASS } from "@/constants/ui-constant";
import { cn } from "@/lib/utils";

// Sends the visitor to /login; a signed-in visitor is passed on to the dashboard by the proxy.
export default function GoogleCta({ className }: { className?: string }) {
  return (
    <Button asChild className={cn(CTA_BUTTON_CLASS, className)}>
      <Link href="/login">
        <Image src="/google-g.svg" alt="" width={20} height={20} />
        Continue with Google
      </Link>
    </Button>
  );
}
