"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PersonColor } from "@/components/ui/MemberAvatar";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomBar } from "./MobileBottomBar";

export interface AppShellProps {
  userName: string;
  userColor?: PersonColor;
  familyName: string;
  memberCount: number;
  children: ReactNode;
}

export function AppShell({
  userName,
  userColor = "person-a",
  familyName,
  memberCount,
  children,
}: AppShellProps) {
  const pathname = usePathname() || "/";

  return (
    <div className="cc-app">
      <Sidebar
        pathname={pathname}
        userName={userName}
        userColor={userColor}
        familyName={familyName}
        memberCount={memberCount}
      />
      <MobileHeader
        pathname={pathname}
        userName={userName}
        userColor={userColor}
      />
      {children}
      <MobileBottomBar pathname={pathname} />
    </div>
  );
}
