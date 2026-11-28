"use client";

import { useEffect } from "react";

import ServerError from "./_components/server-error";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>Something Went Wrong | Kanbo</title>
      <ServerError error={error} retry={retry} />
    </>
  );
}
