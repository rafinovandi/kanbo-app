import { Suspense } from "react";

import BoardGate from "./_components/board-gate";

export const metadata = {
  title: "Board | Kanbo",
};

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={null}>
      <BoardGate params={params} />
    </Suspense>
  );
}
