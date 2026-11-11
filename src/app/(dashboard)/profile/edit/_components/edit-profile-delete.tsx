"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteAccountAction } from "@/actions/account-action";
import ConfirmDeleteDialog from "@/components/common/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Delete Account: blocked while you still own projects; otherwise asks you to type your username to confirm.
export default function EditProfileDelete({
  ownedProjects,
  username,
}: {
  ownedProjects: string[];
  username: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const deleteAccount = async () => {
    const result = await deleteAccountAction(username);
    if (result.status === "error") {
      toast.error(result.message);
      return false;
    }
    toast.success("Account deleted");
    router.replace("/login");
    return true;
  };

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-md flex-col gap-0.5">
            <h2 className="text-sm font-semibold text-destructive">
              Delete Account
            </h2>
            <p className="text-[13px] leading-normal text-muted-foreground">
              Permanently remove your account and leave all projects.{" "}
              {ownedProjects.length > 0
                ? `Delete the projects you own first: ${ownedProjects.join(", ")}.`
                : "This can't be undone."}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={ownedProjects.length > 0}
            onClick={() => setOpen(true)}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Account"
        description="This permanently deletes your account. This can't be undone."
        confirmLabel="Delete Account"
        confirmText={username}
        onConfirm={deleteAccount}
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>You leave every project and are removed from all tasks</li>
          <li>Your agent bots and connected chats are removed</li>
          <li>Tasks you created in other projects stay</li>
        </ul>
      </ConfirmDeleteDialog>
    </>
  );
}
