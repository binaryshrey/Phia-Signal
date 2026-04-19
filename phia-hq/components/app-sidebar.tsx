"use client";

import type { ComponentProps, ComponentType } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiBrain2Fill,
  RiFilePaper2Fill,
  RiHome6Fill,
  RiSettingsFill,
  RiUserSmileFill,
} from "@remixicon/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigationItems: Array<{
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    label: "Dashboard",
    href: "/phia",
    icon: RiHome6Fill,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: RiBrain2Fill,
  },
  {
    label: "Documents",
    href: "#",
    icon: RiFilePaper2Fill,
  },
  {
    label: "Settings",
    href: "#",
    icon: RiSettingsFill,
  },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/8" {...props}>
      <SidebarHeader className="px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-2xl text-white hover:bg-white/10 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-none ">
                <Image src="/phia.svg" alt="phia" width={32} height={32} />
              </div>
              <div className="flex flex-1 items-center text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">Signal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/phia"
                ? pathname === "/phia" || pathname === "/dashboard"
                : pathname === item.href;

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-11 rounded-2xl text-zinc-400 hover:bg-white/8 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white"
                >
                  <Link href={item.href}>
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-2 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Profile"
              className="h-11 rounded-2xl justify-center text-zinc-200 hover:bg-white/8 hover:text-white group-data-[collapsible=icon]:px-0"
            >
              <RiUserSmileFill className="size-4.5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">
                Profile
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
