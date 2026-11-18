import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/components/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "260px";
const SIDEBAR_WIDTH_MOBILE = "280px";
const SIDEBAR_WIDTH_ICON = "80px";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = React.createContext(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }
    return context;
}

const SidebarProvider = React.forwardRef(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback((value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
            setOpenProp(openState);
        }
        else {
            _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }, [setOpenProp, open]);
    const toggleSidebar = React.useCallback(() => {
        return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);
    const state = open ? "expanded" : "collapsed";
    const contextValue = React.useMemo(() => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
    }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]);
    return (<SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
        }} className={cn("group/sidebar-wrapper flex min-h-svh w-full bg-blue-50", className)} ref={ref} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>);
});
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    if (collapsible === "none") {
        return (<div className={cn("flex h-full w-[--sidebar-width] flex-col bg-blue-900 border-r border-blue-800", className)} ref={ref} {...props}>
        {children}
      </div>);
    }
    if (isMobile) {
        return (<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent data-sidebar="sidebar" data-mobile="true" className="w-[--sidebar-width] bg-blue-900 p-0 text-blue-50 [&>button]:hidden border-r-0" style={{
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            }} side={side}>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>);
    }
    return (<div ref={ref} className="group peer hidden text-blue-100 md:block" data-state={state} data-collapsible={state === "collapsed" ? collapsible : ""} data-variant={variant} data-side={side}>
      <div className={cn("relative h-svh w-[--sidebar-width] bg-blue-900 transition-[width] duration-300 ease-in-out", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]")}/>
      <div className={cn("fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-300 ease-in-out md:flex shadow-xl shadow-blue-900/50", side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l border-blue-800", className)} {...props}>
        <div data-sidebar="sidebar" className="flex h-full w-full flex-col bg-blue-900 group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-blue-800 group-data-[variant=floating]:shadow-md">
          {children}
        </div>
      </div>
    </div>);
});
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (<Button ref={ref} data-sidebar="trigger" variant="ghost" size="icon" className={cn("h-8 w-8 text-blue-600 hover:bg-blue-50", className)} onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
        }} {...props}>
        <PanelLeft size={20} />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>);
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (<button ref={ref} data-sidebar="rail" aria-label="Toggle Sidebar" tabIndex={-1} onClick={toggleSidebar} title="Toggle Sidebar" className={cn("absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] group-data-[side=left]:-right-4 group-data-[side=right]:left-0 hover:after:bg-blue-200 sm:flex", "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-blue-50", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className)} {...props}/>);
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
    return (<main ref={ref} className={cn("relative flex min-h-svh flex-1 flex-col bg-blue-50", "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm", className)} {...props}/>);
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
    return (<Input ref={ref} data-sidebar="input" className={cn("h-9 w-full bg-blue-800 border-blue-700 text-blue-50 placeholder:text-blue-300 shadow-none focus-visible:ring-2 focus-visible:ring-blue-400", className)} {...props}/>);
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-4", className)} {...props}/>;
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-4 border-t border-blue-800", className)} {...props}/>;
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
    return (<Separator ref={ref} data-sidebar="separator" className={cn("mx-4 w-auto bg-blue-800", className)} {...props}/>);
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
    return (<div ref={ref} data-sidebar="content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden scrollbar-thin", className)} {...props}/>);
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
    return (<div ref={ref} data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-3", className)} {...props}/>);
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (<Comp ref={ref} data-sidebar="group-label" className={cn("flex h-8 shrink-0 items-center rounded-md px-2 text-[10px] font-bold uppercase tracking-widest text-blue-300 outline-none ring-blue-400 transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0", className)} {...props}/>);
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (<Comp ref={ref} data-sidebar="group-action" className={cn("absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-blue-300 outline-none ring-blue-400 transition-transform hover:bg-blue-800 hover:text-white focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props}/>));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (<ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props}/>));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (<li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props}/>));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva("peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm outline-none ring-blue-400 transition-all hover:bg-blue-800 hover:text-white focus-visible:ring-2 active:bg-blue-800 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-blue-50 data-[active=true]:font-bold data-[active=true]:text-blue-900 data-[active=true]:border-l-4 data-[active=true]:border-blue-400 group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:size-5 [&>svg]:shrink-0", {
    variants: {
        variant: {
            default: "text-blue-100 hover:bg-blue-800 hover:text-white",
            outline: "bg-transparent border border-blue-700 text-blue-100 hover:bg-blue-800 hover:text-white hover:border-blue-600",
        },
        size: {
            default: "h-10 text-sm",
            sm: "h-8 text-xs",
            lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});

const SidebarMenuButton = React.forwardRef(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();
    
    const isCollapsed = state === "collapsed" && !isMobile;

    const buttonChildren = asChild
      ? children
      : React.Children.map(children, child => {
          if (isCollapsed && typeof child === "string") return null;
          return child;
      });

    const button = (
      <Comp ref={ref} data-sidebar="menu-button" data-size={size} data-active={isActive} className={cn(sidebarMenuButtonVariants({ variant, size }), className)} {...props}>
          {buttonChildren}
      </Comp>
    );

    if (!tooltip) return button;
    
    if (typeof tooltip === "string") {
        tooltip = { children: tooltip };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltip}/>
      </Tooltip>
    );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (<Comp ref={ref} data-sidebar="menu-action" className={cn("absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-blue-300 outline-none ring-blue-400 transition-transform peer-hover/menu-button:text-white hover:bg-blue-800 hover:text-white focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-blue-900 md:opacity-0", className)} {...props}/>);
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} data-sidebar="menu-badge" className={cn("pointer-events-none absolute right-2 flex h-5 min-w-5 select-none items-center justify-center rounded-full bg-blue-400 px-1.5 text-[10px] font-bold tabular-nums text-blue-900", "peer-hover/menu-button:bg-blue-300", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-2.5", "peer-data-[size=lg]/menu-button:top-3.5", "group-data-[collapsible=icon]:hidden", className)} {...props}/>));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {
    const width = React.useMemo(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);
    return (<div ref={ref} data-sidebar="menu-skeleton" className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon"/>}
      <Skeleton className="h-4 max-w-[--skeleton-width] flex-1" data-sidebar="menu-skeleton-text" style={{
            "--skeleton-width": width,
        }}/>
    </div>);
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => (<ul ref={ref} data-sidebar="menu-sub" className={cn("mx-4 flex min-w-0 translate-x-px flex-col gap-1 border-l border-blue-700 px-3 py-1", "group-data-[collapsible=icon]:hidden", className)} {...props}/>));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => (<li ref={ref} {...props}/>));
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return (<Comp ref={ref} data-sidebar="menu-sub-button" data-size={size} data-active={isActive} className={cn("flex h-8 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-3 text-blue-200 outline-none ring-blue-400 aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-blue-800 hover:text-white focus-visible:ring-2 active:bg-blue-800 disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-blue-300", "data-[active=true]:text-blue-900 data-[active=true]:font-semibold data-[active=true]:bg-blue-100", size === "sm" && "text-xs", size === "md" && "text-sm", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar, };