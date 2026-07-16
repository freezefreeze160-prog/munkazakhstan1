"use client"

import { useLanguage } from "@/contexts/language-context"
import { Mail, Phone } from "lucide-react"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-muted mt-12 py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <a href="mailto:mun.nis.edu.kz@outlook.com" className="hover:text-foreground transition-colors">
              mun.nis.edu.kz@outlook.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <a href="tel:+77076691509" className="hover:text-foreground transition-colors">
              +7 707 669 15 09
            </a>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">© 2025 MUN Kazakhstan. {t("contact")}</p>
      </div>
    </footer>
  )
}
