// TEMPORARY "Style check" page: compares shadcn (Nova) + Kanbo tokens against the
// "Kanban Board" design canvas. Replaced by a redirect to /dashboard in the login phase.
import { Add, Element3, Filter, Notification, SearchNormal1, Sort } from "iconsax-react";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

const priorities = [
  { label: "High", className: "bg-kb-red-tint text-kb-red-fg" },
  { label: "Medium", className: "bg-kb-yellow-tint text-kb-yellow-fg" },
  { label: "Low", className: "bg-kb-lilac-tint text-kb-lilac-fg" },
];

const roles = [
  { label: "UI/UX", className: "bg-kb-lilac-tint text-kb-lilac-fg" },
  { label: "Frontend", className: "bg-kb-blue-tint text-kb-blue-fg" },
  { label: "Backend", className: "bg-kb-green-tint text-kb-green-fg" },
  { label: "Mobile", className: "bg-kb-orange-tint text-kb-orange-fg" },
  { label: "QA", className: "bg-kb-yellow-tint text-kb-yellow-fg" },
  { label: "Product Manager", className: "bg-kb-pink-tint text-kb-pink-fg" },
  { label: "Copywriter", className: "bg-kb-gray-tint text-kb-gray-fg" },
];

const statuses = [
  { label: "To Do", dot: "bg-kb-gray" },
  { label: "In Progress", dot: "bg-kb-blue" },
  { label: "Preview", dot: "bg-kb-lilac" },
  { label: "Done", dot: "bg-kb-green" },
];

const avatars = [
  { initials: "RA", className: "bg-kb-blue-tint text-kb-blue-fg" },
  { initials: "AL", className: "bg-kb-orange-tint text-kb-orange-fg" },
  { initials: "BS", className: "bg-kb-lilac-tint text-kb-lilac-fg" },
];

export default function StyleCheckPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-kb-blue text-white">
            <Element3 size={18} variant="Bold" color="currentColor" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Kanbo · Style check</h1>
            <p className="text-sm text-muted-foreground">
              shadcn Nova + Kanbo tokens. Compare with the &ldquo;Kanban Board&rdquo; canvas.
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Notification size={18} variant="Linear" color="currentColor" />
        </Button>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-kb-text-2">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Add size={16} variant="Linear" color="currentColor" aria-hidden /> New Project
          </Button>
          <Button variant="secondary">
            <Filter size={16} variant="Linear" color="currentColor" aria-hidden /> Filter
          </Button>
          <Button variant="outline">
            <Sort size={16} variant="Linear" color="currentColor" aria-hidden /> Sort
          </Button>
          <Button variant="ghost">Edit</Button>
          <Button variant="destructive">Delete Task</Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-kb-text-2">Priority</h2>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <Badge key={p.label} className={`w-[68px] justify-center ${p.className}`}>
                {p.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <h2 className="text-sm font-medium text-kb-text-2">Roles</h2>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <Badge key={r.label} className={r.className}>
                {r.label}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-kb-text-2">Status</h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Badge key={s.label} variant="outline" className="gap-1.5 text-foreground">
              <span className={`size-2 rounded-full ${s.dot}`} aria-hidden />
              {s.label}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Website Redesign</CardTitle>
            <CardDescription>8 of 13 done</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Progress value={62} className="h-1.5" aria-label="Project progress" />
              <span className="text-sm font-medium tabular-nums">62%</span>
            </div>
            <div className="flex items-center justify-between">
              <AvatarGroup>
                {avatars.map((a) => (
                  <Avatar key={a.initials} size="sm">
                    <AvatarFallback className={`text-xs font-semibold ${a.className}`}>
                      {a.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <AvatarGroupCount>+2</AvatarGroupCount>
              </AvatarGroup>
              <span className="text-xs text-muted-foreground">Due Nov 12</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-kb-text-2">Search</h2>
            <InputGroup>
              <InputGroupAddon>
                <SearchNormal1 size={16} variant="Linear" color="currentColor" aria-hidden />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search tasks" aria-label="Search tasks" />
              <InputGroupAddon align="inline-end">
                <Kbd>⌘ K</Kbd>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-kb-text-2">Slider</h2>
            <Slider defaultValue={[50]} max={100} step={50} aria-label="Priority" />
          </div>
          <div className="rounded-xl bg-kb-surface p-4 text-sm text-kb-text-2">
            Gray note box (<code className="font-mono text-xs">bg-kb-surface</code>), as used on Sign In and
            in empty states.
          </div>
        </div>
      </section>
    </main>
  );
}
