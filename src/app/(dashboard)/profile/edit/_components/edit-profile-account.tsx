import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The sign in method (Google) and the email it uses.
export default function EditProfileAccount({ email }: { email: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#8E918F] bg-[#131314]">
            <Image src="/google-g.svg" alt="" width={20} height={20} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Signed in with Google</span>
            <span className="text-[13px] text-muted-foreground">{email}</span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-kb-green-tint text-kb-green-fg"
        >
          Connected
        </Badge>
      </CardContent>
    </Card>
  );
}
