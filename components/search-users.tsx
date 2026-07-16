"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Phone } from "lucide-react"
import Link from "next/link"
import { getRoleBadgeColor, getRoleLabel, regions } from "@/lib/roles"
import type { UserProfile } from "@/lib/roles"

export function SearchUsers() {
  const { language, t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [suggestions, setSuggestions] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching users:", error)
      } else {
        setUsers(data || [])
        setFilteredUsers(data || [])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [supabase])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
      setSuggestions([])
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter((user) => user.full_name.toLowerCase().includes(query))

      setFilteredUsers(filtered)

      if (searchQuery.length >= 3 && filtered.length > 0 && filtered.length <= 5) {
        setSuggestions(filtered.slice(0, 5))
      } else {
        setSuggestions([])
      }
    }
  }, [searchQuery, users])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">{t("search_users")}</h1>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder={t("search_by_name")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg"
        />
        {suggestions.length > 0 && searchQuery.length >= 3 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-10 overflow-hidden">
            <div className="px-4 py-2 bg-muted text-sm font-medium">{t("suggestions")}</div>
            {suggestions.map((user) => (
              <Link key={user.id} href={`/profile/${user.user_id}`}>
                <div className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.photo_url || undefined} alt={user.full_name} />
                      <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{getRoleLabel(user.role, language)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t("no_users_found")}</p>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Link key={user.id} href={`/profile/${user.user_id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.photo_url || undefined} alt={user.full_name} />
                      <AvatarFallback className="text-lg">{user.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{user.full_name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role, language)}</Badge>
                        {user.region && (
                          <Badge variant="outline">{regions[user.region as keyof typeof regions]?.[language]}</Badge>
                        )}
                      </div>
                      {user.bio && <p className="text-muted-foreground mb-3 line-clamp-2">{user.bio}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
