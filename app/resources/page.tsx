"use client"

import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RESOURCES } from "@/lib/resources-content"
import { BookOpen, HelpCircle, ListOrdered, FileText, Download, GraduationCap } from "lucide-react"

export default function ResourcesPage() {
  const { t, language } = useLanguage()
  const content = RESOURCES[language]

  function downloadTemplate() {
    const blob = new Blob(["﻿" + content.positionPaper], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "position-paper-template.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <GraduationCap className="w-7 h-7 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{t("resources_title")}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("resources_desc")}</p>
          </div>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <HelpCircle className="w-6 h-6 text-primary" />
              {t("faq_title")}
            </h2>
            <Card>
              <CardContent className="p-2 sm:p-4">
                <Accordion type="single" collapsible className="w-full">
                  {content.faq.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* Rules of Procedure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <ListOrdered className="w-6 h-6 text-primary" />
              {t("rop_title")}
            </h2>
            <Card>
              <CardContent className="p-6">
                <ol className="space-y-3">
                  {content.rop.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Glossary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <BookOpen className="w-6 h-6 text-primary" />
              {t("glossary_title")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {content.glossary.map((term, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-4">
                    <p className="font-semibold text-foreground">{term.term}</p>
                    <p className="text-sm text-muted-foreground mt-1">{term.def}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Position Paper Template */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <FileText className="w-6 h-6 text-primary" />
              {t("position_paper_template_title")}
            </h2>
            <Card>
              <CardContent className="p-6">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-4 overflow-x-auto">
                  {content.positionPaper}
                </pre>
                <Button onClick={downloadTemplate} variant="outline" className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  {t("download_template")}
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
