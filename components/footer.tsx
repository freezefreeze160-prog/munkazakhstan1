"use client"

import { useLanguage } from "@/contexts/language-context"
import { Mail, Phone, Bug } from "lucide-react"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-muted mt-12 py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <a href="mailto:munkazakhstan@mail.ru" className="hover:text-foreground transition-colors">
              munkazakhstan@mail.ru
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <a href="tel:+77076691509" className="hover:text-foreground transition-colors">
              +7 707 669 15 09
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <a href="tel:+77083078542" className="hover:text-foreground transition-colors">
              +7 708 307 8542
            </a>
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <a
            href={`https://wa.me/77076691509?text=${encodeURIComponent(t("report_bug_prefill"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <Bug className="h-4 w-4" />
            {t("report_bug")}
          </a>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">© 2025 MUN Kazakhstan. {t("contact")}</p>
      </div>
    </footer>
  )
}
