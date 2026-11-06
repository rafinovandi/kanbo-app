import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

export default function UserAvatar({
  name,
  avatarUrl,
  avatarBg,
  avatarFg,
  size = "default",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  avatarBg?: string;
  avatarFg?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} referrerPolicy="no-referrer" />}
      <AvatarFallback
        className={cn("font-semibold", size === "sm" ? "text-[10px]" : "text-xs")}
        style={{ backgroundColor: avatarBg, color: avatarFg }}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
