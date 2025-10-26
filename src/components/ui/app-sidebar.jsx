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
    <Sidebar className="   backdrop-blur ml-1   rounded-2xl  ">

      <div className="pr-2 pl-6 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between">
            {/* Иконкаи корбар (агар лозим шавад) */}
            {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shadow-sm">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div> */}
            <h1 className="text-lg font-bold tracking-tight">Admin Panel</h1>
          </div>
          <img
            src="/logo.png"
            alt="Logo"
            className="w-14 h-14 object-contain rounded-md"
          />
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu className={"pr-2"}>
              {items.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="group relative mx-2 my-1 "
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

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">Admin</span>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}


// import { useState, useEffect } from "react";
// import {
//   Building,
//   Star,
//   Users,
//   FolderOpen,
//   UserCircle,
//   ChevronRight
// } from "lucide-react"
// import { useLocation } from "react-router-dom"

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"
// import { Link } from "react-router-dom"

// const items = [
//   {
//     title: "Users",
//     url: "/",
//     icon: Users,
//     badge: "12"
//   },
//   {
//     title: "Doctors",
//     url: "/doctors",
//     icon: Users,
//     badge: "12"
//   },
//   {
//     title: "Categories",
//     url: "/categoriy",
//     icon: FolderOpen,
//     badge: "8"
//   },
//   {
//     title: "Branches",
//     url: "/filial",
//     icon: Building,
//     badge: "3"
//   },
//   {
//     title: "Reviews",
//     url: "/otziv",
//     icon: Star,
//     badge: "47"
//   },
// ]

// const light = [
//   {
//     img: "/light-1-mac.webp"
//   },
//   {
//     img: "/light-2-mac.webp"
//   },
//   {
//     img: "/light-3-mac.webp"
//   }
// ]

// const dark = [
//   {
//     img: "/bg-mac.jpg",
//   },
//   {
//     img: "/dark-mac-mg-2.jpg"
//   },
//   {
//     img: "/dark-mac-3.jpg"
//   }
// ]

// export function AppSidebar() {
//   const location = useLocation();
//   const currentPath = location.pathname;
//   const [selectedBackground, setSelectedBackground] = useState("");
//   const [currentTheme, setCurrentTheme] = useState("dark");

//   // Загружаем выбранный фон из localStorage при монтировании
//   useEffect(() => {
//     const savedBackground = localStorage.getItem("selectedBackground");
//     const savedTheme = localStorage.getItem("theme");

//     if (savedBackground) {
//       setSelectedBackground(savedBackground);
//       applyBackground(savedBackground);

//       // Определяем тему на основе выбранного фона
//       const theme = determineTheme(savedBackground);
//       setCurrentTheme(theme);
//       applyTheme(theme);
//     } else {
//       // Устанавливаем темный фон по умолчанию
//       const defaultDark = dark[0].img;
//       setSelectedBackground(defaultDark);
//       localStorage.setItem("selectedBackground", defaultDark);
//       applyBackground(defaultDark);
//       setCurrentTheme("dark");
//       applyTheme("dark");
//     }
//   }, []);

//   // Функция для определения темы на основе выбранного фона
//   const determineTheme = (backgroundImage) => {
//     const isLightBackground = light.some(item => item.img === backgroundImage);
//     return isLightBackground ? "light" : "dark";
//   };

//   // Функция для применения темы к body
//   const applyTheme = (theme) => {
//     if (theme === "dark") {
//       document.body.classList.add("dark");
//       document.body.classList.remove("light");
//     } else {
//       document.body.classList.add("light");
//       document.body.classList.remove("dark");
//     }
//     localStorage.setItem("theme", theme);
//   };

//   const applyBackground = (backgroundImage) => {
//     document.body.style.backgroundImage = `url(${backgroundImage})`;
//     document.body.style.backgroundSize = "cover";
//     document.body.style.backgroundPosition = "center";
//     document.body.style.backgroundRepeat = "no-repeat";
//     document.body.style.backgroundAttachment = "fixed";
//   };

//   // Обработчик выбора фона
//   const handleBackgroundSelect = (imgUrl) => {
//     setSelectedBackground(imgUrl);
//     localStorage.setItem("selectedBackground", imgUrl);

//     // Определяем и применяем тему на основе выбранного фона
//     const theme = determineTheme(imgUrl);
//     setCurrentTheme(theme);
//     applyTheme(theme);

//     applyBackground(imgUrl);
//   };

//   return (
//     <Sidebar className="backdrop-blur ml-1 rounded-2xl">
//       <div className="p-6">
//         <div className="flex items-center gap-3">
//           <div className="flex items-center justify-between w-full">
//             <h1 className="text-lg font-bold">Admin Panel</h1>
//             <img src="/logo.png" alt="" className="w-[20%]" />
//           </div>
//         </div>
//       </div>

//       <SidebarContent >
//         <SidebarGroup className={"custom-scroll"}>
//           <SidebarGroupContent className={"custom-scroll"}>
//             <SidebarMenu >
//               {items.map((item) => {
//                 const isActive = currentPath === item.url;

//                 return (
//                   <SidebarMenuItem key={item.title}>
//                     <SidebarMenuButton
//                       asChild
//                       isActive={isActive}
//                       className="group relative mx-2 my-1 "
//                     >
//                       <Link
//                         to={item.url}
//                         className="flex items-center gap-3 px-3 py-5 rounded-lg transition-all duration-200 hover:bg-accent hover:shadow-sm "
//                       >
//                         <div className={`p-2 rounded-lg transition-colors ${isActive
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted text-muted-foreground group-hover:bg-accent"
//                           }`}>
//                           <item.icon className="h-4 w-4" />
//                         </div>

//                         <span className={`font-medium flex-1 transition-colors ${isActive ? "text-foreground" : "text-foreground/80"
//                           }`}>
//                           {item.title}
//                         </span>

//                         <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
//                           } ${isActive ? "rotate-90" : ""}`} />
//                       </Link>
//                     </SidebarMenuButton>
//                   </SidebarMenuItem>
//                 );
//               })}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       <div className="w-[95%] m-auto">
//         <div>
//           <h3 className="font-medium mb-2">Light Backgrounds</h3>
//           <div className=" py-2 overflow-x-auto flex items-center gap-3" style={{ scrollbarColor: "transparent transparent" }}>
//             {light.map((e, i) => (
//               <img
//                 key={i}
//                 src={e.img}
//                 alt=""
//                 className={`w-[30%] rounded-2xl border h-[7vh] cursor-pointer transition-all duration-200 ${selectedBackground === e.img
//                   ? "border-2 border-primary shadow-lg scale-105"
//                   : "border-border hover:border-primary/50"
//                   }`}
//                 onClick={() => handleBackgroundSelect(e.img)}
//               />
//             ))}
//           </div>
//         </div>

//         <div className="mb-10 mt-6">
//           <h3 className="font-medium mb-2">Dark Backgrounds</h3>
//           <div className=" py-2 overflow-x-auto flex items-center gap-3" style={{ scrollbarColor: "transparent transparent" }}>
//             {dark.map((e, i) => (
//               <img
//                 key={i}
//                 src={e.img}
//                 alt=""
//                 className={`w-[30%] rounded-2xl border h-[7vh] cursor-pointer transition-all duration-200 ${selectedBackground === e.img
//                   ? "border-2 border-primary shadow-lg scale-105"
//                   : "border-border hover:border-primary/50"
//                   }`}
//                 onClick={() => handleBackgroundSelect(e.img)}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Отображение текущей темы */}
//         <div className="text-xs text-muted-foreground text-center mt-4">
//           Current theme: <span className="font-medium capitalize">{currentTheme}</span>
//         </div>
//       </div>

//       <div className="p-4 border-t mt-auto">
//         <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
//           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
//             <UserCircle className="h-4 w-4 text-primary" />
//           </div>
//           <div className="flex flex-col flex-1 min-w-0">
//             <span className="text-sm font-medium truncate">Admin</span>
//           </div>
//         </div>
//       </div>
//     </Sidebar>
//   )
// }
