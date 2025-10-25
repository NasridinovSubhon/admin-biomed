import {

  Building,
  Star,
  Users,
  FolderOpen,

  UserCircle,
  ChevronRight
} from "lucide-react"
import { useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

const items = [
  {
    title: "Users",
    url: "/",
    icon: Users,
    badge: "12"
  },
  {
    title: "Doctors",
    url: "/doctors",
    icon: Users,
    badge: "12"
  },
  {
    title: "Categories",
    url: "/categoriy",
    icon: FolderOpen,
    badge: "8"
  },
  {
    title: "Branches",
    url: "/filial",
    icon: Building,
    badge: "3"
  },
  {
    title: "Reviews",
    url: "/otziv",
    icon: Star,
    badge: "47"
  },

]

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar className="   backdrop-blur ml-1  h-[98vh] mt-[1vh] rounded-2xl  ">

      <div className="p-6 ">
        <div className="flex items-center gap-3 ">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl  shadow-sm">
            <Users className="h-5 w-5 " />
          </div> */}
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>

          </div>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = currentPath === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="group relative mx-2 my-1"
                    >
                      <Link
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-5 rounded-lg transition-all duration-200 hover:bg-accent hover:shadow-sm"
                      >
                        <div className={`p-2 rounded-lg transition-colors ${isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-accent"
                          }`}>
                          <item.icon className="h-4 w-4" />
                        </div>

                        <span className={`font-medium flex-1 transition-colors ${isActive ? "text-foreground" : "text-foreground/80"
                          }`}>
                          {item.title}
                        </span>

                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          } ${isActive ? "rotate-90" : ""}`} />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile */}
      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">Admin User</span>
            <span className="text-xs text-muted-foreground truncate">Online</span>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
