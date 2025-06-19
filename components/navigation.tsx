"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, Target, Crown, Settings } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Fixture", icon: Calendar },
    { href: "/mi-prode", label: "Mi Prode", icon: Target },
    { href: "/ranking", label: "Ranking", icon: Crown },
    { href: "/admin", label: "Admin", icon: Settings },
  ]

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-slate-900">Prode Mundial</span>
          </div>

          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
