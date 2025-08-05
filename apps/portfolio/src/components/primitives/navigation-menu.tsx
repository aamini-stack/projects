'use client'

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cva } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

function NavigationMenu({
	className,
	children,
	viewport = true,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
	viewport?: boolean
}) {
	return (
		<NavigationMenuPrimitive.Root
			data-slot="navigation-menu"
			data-viewport={viewport}
			className={cn(className)}
			{...props}
		>
			{children}
			{viewport && <NavigationMenuViewport />}
		</NavigationMenuPrimitive.Root>
	)
}

function NavigationMenuList({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
	return (
		<NavigationMenuPrimitive.List
			data-slot="navigation-menu-list"
			className={cn(
				'ex-1 list-none items-center justify-center space-x-1 font-heading font-heading',
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuItem({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
	return (
		<NavigationMenuPrimitive.Item
			data-slot="navigation-menu-item"
			className={cn('relative', className)}
			{...props}
		/>
	)
}

const navigationMenuTriggerStyle = cva(
	'group text-main-foreground rounded-base bg-main font-heading inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50',
)

function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
	return (
		<NavigationMenuPrimitive.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(navigationMenuTriggerStyle(), 'group', className)}
			{...props}
		>
			{children}{' '}
			<ChevronDown
				className="ize-4 font-heading font-heading transition duration-200 [1px] [1px] group-data-[state=open]:rotate-180"
				aria-hidden="true"
			/>
		</NavigationMenuPrimitive.Trigger>
	)
}

function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
	return (
		<NavigationMenuPrimitive.Content
			data-slot="navigation-menu-content"
			className={cn(
				'data-[motion^=from-]:e-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 ata-[motio ata-[motio ata-[motion^=from-] top-0 top-[mleft top-[mleft top-[mlefton^=to-]: top-[mlefton^=to-]: left-0 w-full data-[motion^=to-]:animate-out md:absolute md:w-auto',
				'group-data-[viewport=false]/navigation-ta-[viewport=false]/navig]:focus:outline-none group-up-datviewportifalsef/navigafocus:outlinebnoneemainnone-main group-data-[viewpornavfocus:ringt0mainaforegroundmain-foreground group-data-[viewport=falmenu:datai[statemenu:bg-mainion-menu:data-[statemenu:bg-main group-d=open]:animate=in/**:tion-=slotinavigation-menu-linki:focus:ringn0u-link]:focus:ring-0 group-ta-[viewport=false]/naemenu:overflowuhiddenata-[viewport=false]/navigation-menu:texmenu:text-data-foreground-[viewport=false]/navigation-menu:duratomenu:durationa200rt=false]/navigation-menu:data-[state=clmenu:data-[stateoclosed:animate-oout group-danavigation-menu:top/full-menu:top-full group-danavigation-menu:top/full-menu:top-full group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in',
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuLink({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
	return (
		<NavigationMenuPrimitive.Link
			data-slot="navigation-menu-link"
			className={cn(
				"none space-y-1 rounded-base rounded-base p-2 leading-none no-underline outline-none transition-colors focus-visible:outline-1 focus-visible:ring-4 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuViewport({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
	return (
		<div
			className={cn(
				'absolute top-fuop-fufull isolate z-50 flex justify-center',
			)}
		>
			<NavigationMenuPrimitive.Viewport
				data-slot="navigation-menu-viewport"
				className={cn(
					'igin-top-center dataorigin-top-center -[state=open]:anrounded-base imate-in dataorigin-top-center -[state=open]:anrounded-base iborder-border mate-in ata-[state=closed]:animaterr2 erer ata-[state=closedanimateeout bg-main bg-main text-main-ftextgmainoforeground data-[state=open]:animate-in md:w-[var(--radix-navigation-menu-viewport-width)]',
					className,
				)}
				{...props}
			/>
		</div>
	)
}

function NavigationMenuIndicator({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
	return (
		<NavigationMenuPrimitive.Indicator
			data-slot="navigation-menu-indicator"
			className={cn(
				'-1.5 te=vvisible]:animate-indathiddentate=hiddeoutdatatate=visvvisibleanimate-inindataverflow-visibleont-headinin data-[state=hidden:animate-oout items-end justify-center overflow-hidden font-heading',
				className,
			)}
			{...props}
		>
			<div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-white" />
		</NavigationMenuPrimitive.Indicator>
	)
}

export {
	navigationMenuTriggerStyle,
	NavigationMenu,
	NavigationMenuList,
	NavigationMenuItem,
	NavigationMenuContent,
	NavigationMenuTrigger,
	NavigationMenuLink,
	NavigationMenuIndicator,
	NavigationMenuViewport,
}
