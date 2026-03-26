import { Component } from "solid-js"
import { useLanguage } from "@/context/language"
import { useSettings } from "@/context/settings"
import { Select } from "@opencode-ai/ui/select"
import { SettingsList } from "./settings-list"

export const SettingsAppearance: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  const densityOptions = [
    { value: "compact", label: language.t("settings.appearance.density.compact") },
    { value: "normal", label: language.t("settings.appearance.density.normal") },
    { value: "comfortable", label: language.t("settings.appearance.density.comfortable") },
  ] as const
  const densityOptionsList = [...densityOptions]

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--surface-stronger-non-alpha)_92%,transparent)_calc(100%_-_24px),transparent)] backdrop-blur-md">
        <div class="flex flex-col gap-1 pt-6 pb-8">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.tab.appearance")}</h2>
        </div>
      </div>

      <div class="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-1">
          <SettingsList>
            <div class="flex flex-wrap items-center gap-4 py-3.5 border-b border-border-weaker-base last:border-none sm:flex-nowrap">
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <span class="text-14-medium text-text-strong">{language.t("settings.appearance.density.title")}</span>
                <span class="text-12-regular text-text-weak leading-5">{language.t("settings.appearance.density.description")}</span>
              </div>
              <div class="flex w-full justify-end sm:w-auto sm:shrink-0">
                <Select
                  options={densityOptionsList}
                  current={densityOptionsList.find((o) => o.value === settings.appearance.interfaceDensity())}
                  value={(o) => o.value}
                  label={(o) => o.label}
                  onSelect={(option) => option && settings.appearance.setInterfaceDensity(option.value as any)}
                  variant="secondary"
                  size="small"
                  triggerVariant="settings"
                />
              </div>
            </div>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}
