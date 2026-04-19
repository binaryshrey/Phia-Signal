import { AppSidebar } from "@/components/app-sidebar";
import BrainNodesGraph from "@/components/BrainNodesGraph";
import FaceMeshOverlay from "@/components/FaceMeshOverlay";
import LearningsPills from "@/components/LearningsPills";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="dark min-h-screen overflow-x-hidden bg-[#0E0D12] text-white">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="min-h-screen bg-[#0E0D12] text-white md:m-0 md:rounded-none md:shadow-none">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 text-zinc-300 hover:bg-white/10 hover:text-white" />
              <Separator
                orientation="vertical"
                className="mr-2 bg-white/12 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink
                      href="#"
                      className="text-zinc-400 hover:text-white"
                    >
                      Phia
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-zinc-500" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white">
                      Analytics
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" style={{ height: "60vh" }}>
              <div className="flex h-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
                <FaceMeshOverlay imageUrl="/pic.jpg" />
              </div>
              <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 h-full">
                <BrainNodesGraph />
              </div>
            </div>
            <div className="min-h-75 flex-1 rounded-xl border border-white/10 bg-white/5 md:min-h-min p-5">
              <LearningsPills />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
