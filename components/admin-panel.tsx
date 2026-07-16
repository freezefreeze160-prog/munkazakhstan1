"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/role-badge"
import { Search, Trash2, Check, X } from "lucide-react"
import { REGIONS } from "@/lib/roles"

interface Profile {
  id: string
  user_id: string
  full_name: string
  bio: string | null
  photo_url: string | null
  role: string
  region: number | null
  phone: string | null
  supervisor_id: string | null
  is_team_member: boolean
  team_role: string | null
}

const ROLE_OPTIONS = [
  { value: "participant", label: { ru: "Участник", kk: "Қатысушы", en: "Participant" } },
  { value: "deputy", label: { ru: "Заместитель", kk: "Орынбасар", en: "Deputy" } },
  { value: "general_secretary", label: { ru: "Генеральный секретарь", kk: "Бас хатшы", en: "General Secretary" } },
  { value: "admin", label: { ru: "Администратор", kk: "Әкімші", en: "Admin" } },
  { value: "founder", label: { ru: "Основатель", kk: "Құрушы", en: "Founder" } },
]

export default function AdminPanel() {
  const { t, language } = useLanguage()
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.full_name.toLowerCase().includes(query) ||
            user.bio?.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError

      setUsers(profiles || [])
      setFilteredUsers(profiles || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    setUpdatingUserId(userId)
    try {
      // Use SECURITY DEFINER function to bypass RLS
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: userId,
        new_role: newRole
      })

      if (error) {
        console.error("[v0] Role update error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      if (data === false) {
        alert("Permission denied - only founder can change roles")
        return
      }

      // Update local state immediately
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u))
      setFilteredUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error("[v0] Error updating user role:", error)
      alert("Error updating user")
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function updateUserRegion(userId: string, newRegion: number) {
    setUpdatingUserId(userId)
    try {
      const { data, error } = await supabase.rpc('admin_update_user_region', {
        target_user_id: userId,
        new_region: newRegion
      })

      if (error) {
        console.error("[v0] Region update error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      if (data === false) {
        alert("Permission denied - only founder can change regions")
        return
      }

      // Update local state immediately
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, region: newRegion } : u))
      setFilteredUsers(prev => prev.map(u => u.user_id === userId ? { ...u, region: newRegion } : u))
    } catch (error) {
      console.error("[v0] Error updating user region:", error)
      alert("Error updating user")
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function updateSupervisor(deputyUserId: string, supervisorUserId: string | null) {
    setUpdatingUserId(deputyUserId)
    try {
      const { data, error } = await supabase.rpc('admin_assign_supervisor', {
        deputy_user_id: deputyUserId,
        supervisor_user_id: supervisorUserId
      })

      if (error) {
        console.error("[v0] Supervisor update error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      if (data === false) {
        alert("Permission denied - only founder can assign supervisors")
        return
      }

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === deputyUserId ? { ...u, supervisor_id: supervisorUserId } : u))
      setFilteredUsers(prev => prev.map(u => u.user_id === deputyUserId ? { ...u, supervisor_id: supervisorUserId } : u))
      
      await loadUsers() // Reload to get fresh data
    } catch (error) {
      console.error("[v0] Error updating supervisor:", error)
      alert("Error updating supervisor")
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function updateTeamMember(userId: string, isMember: boolean, customRole?: string) {
    setUpdatingUserId(userId)
    try {
      const { data, error } = await supabase.rpc('admin_update_team_member', {
        target_user_id: userId,
        is_member: isMember,
        custom_role: customRole || null
      })

      if (error) {
        console.error("[v0] Team member update error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      if (data === false) {
        alert("Permission denied - only founder can manage team members")
        return
      }

      // Update local state
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_team_member: isMember, team_role: customRole || null } : u))
      setFilteredUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_team_member: isMember, team_role: customRole || null } : u))
    } catch (error) {
      console.error("[v0] Error updating team member:", error)
      alert("Error updating team member")
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function deleteUser(userId: string) {
    setDeletingUserId(userId)
    try {
      // Use SECURITY DEFINER function to bypass RLS
      const { data, error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      })

      if (error) {
        console.error("[v0] Delete error:", error)
        alert(`Error: ${error.message}`)
        return
      }

      if (data === false) {
        alert("Permission denied - only founder can delete users")
        return
      }

      // Remove from local state
      setUsers(prev => prev.filter(u => u.user_id !== userId))
      setFilteredUsers(prev => prev.filter(u => u.user_id !== userId))
      setConfirmDelete(null)
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      alert("Error deleting user")
    } finally {
      setDeletingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("search_users")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t("no_users_found")}</p>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {user.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{user.full_name}</h3>
                    <RoleBadge role={user.role} region={user.region} />
                  </div>
                  {user.bio && <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>}
                  {user.phone && <p className="text-sm text-muted-foreground mt-1">📞 {user.phone}</p>}
                </div>

                <div className="flex flex-col gap-2 min-w-[220px]">
                  <Select 
                    value={user.role} 
                    onValueChange={(value) => updateUserRole(user.user_id, value)}
                    disabled={updatingUserId === user.user_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_role")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label[language as keyof typeof role.label]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={user.region?.toString() || ""}
                    onValueChange={(value) => updateUserRegion(user.user_id, Number.parseInt(value))}
                    disabled={updatingUserId === user.user_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("region")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGIONS).map(([regionNum, cityNames]) => (
                        <SelectItem key={regionNum} value={regionNum}>
                          {cityNames[language as keyof typeof cityNames]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Supervisor selector - only show for Deputies */}
                  {user.role === "deputy" && (
                    <Select
                      value={user.supervisor_id || "none"}
                      onValueChange={(value) => updateSupervisor(user.user_id, value === "none" ? null : value)}
                      disabled={updatingUserId === user.user_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ru" ? "Супервайзер" : language === "kk" ? "Супервайзер" : "Supervisor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === "ru" ? "Без супервайзера" : language === "kk" ? "Супервайзерсіз" : "No supervisor"}</SelectItem>
                        {users
                          .filter(u => u.role === "general_secretary" && u.region === user.region)
                          .map(genSec => (
                            <SelectItem key={genSec.user_id} value={genSec.user_id}>
                              {genSec.full_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Team Member Management */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`team-${user.user_id}`}
                        checked={user.is_team_member || false}
                        onChange={(e) => {
                          const isMember = e.target.checked
                          if (!isMember) {
                            updateTeamMember(user.user_id, false)
                          } else {
                            // Default role when adding to team
                            updateTeamMember(user.user_id, true, "Team Member")
                          }
                        }}
                        disabled={updatingUserId === user.user_id}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`team-${user.user_id}`} className="text-sm cursor-pointer font-medium">
                        {language === "ru" ? "Член команды" : language === "kk" ? "Команда мүшесі" : "Team Member"}
                      </label>
                    </div>
                    
                    {user.is_team_member && (
                      <Select
                        value={user.team_role || ""}
                        onValueChange={(value) => updateTeamMember(user.user_id, true, value)}
                        disabled={updatingUserId === user.user_id}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={language === "ru" ? "Выберите роль" : language === "kk" ? "Рөлді таңдаңыз" : "Select role"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical Founder">
                            {language === "ru" ? "Технический основатель" : language === "kk" ? "Техникалық құрылтайшы" : "Technical Founder"}
                          </SelectItem>
                          <SelectItem value="Founder of MUN Kazakhstan">
                            {language === "ru" ? "Основатель MUN Kazakhstan" : language === "kk" ? "MUN Kazakhstan құрылтайшысы" : "Founder of MUN Kazakhstan"}
                          </SelectItem>
                          <SelectItem value="Content Manager">
                            {language === "ru" ? "Контент менеджер" : language === "kk" ? "Контент менеджері" : "Content Manager"}
                          </SelectItem>
                          <SelectItem value="Lead Content Manager">
                            {language === "ru" ? "Главный контент менеджер" : language === "kk" ? "Бас контент менеджері" : "Lead Content Manager"}
                          </SelectItem>
                          <SelectItem value="Designer">
                            {language === "ru" ? "Дизайнер" : language === "kk" ? "Дизайнер" : "Designer"}
                          </SelectItem>
                          <SelectItem value="Lead Designer">
                            {language === "ru" ? "Главный дизайнер" : language === "kk" ? "Бас дизайнер" : "Lead Designer"}
                          </SelectItem>
                          <SelectItem value="Partnership Manager">
                            {language === "ru" ? "Менеджер по партнёрству" : language === "kk" ? "Серіктестік менеджері" : "Partnership Manager"}
                          </SelectItem>
                          <SelectItem value="Lead Partnership Manager">
                            {language === "ru" ? "Главный менеджер по партнёрству" : language === "kk" ? "Бас серіктестік менеджері" : "Lead Partnership Manager"}
                          </SelectItem>
                          <SelectItem value="Marketing Manager">
                            {language === "ru" ? "Маркетинг менеджер" : language === "kk" ? "Маркетинг менеджері" : "Marketing Manager"}
                          </SelectItem>
                          <SelectItem value="Community Manager">
                            {language === "ru" ? "Менеджер сообщества" : language === "kk" ? "Қоғамдастық менеджері" : "Community Manager"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {confirmDelete === user.user_id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteUser(user.user_id)}
                        disabled={deletingUserId === user.user_id}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {deletingUserId === user.user_id ? "..." : t("confirm")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t("cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(user.user_id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete_user")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
