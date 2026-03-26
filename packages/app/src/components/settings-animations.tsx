import { Component } from "solid-js"
import { useLanguage } from "@/context/language"
import { useSettings } from "@/context/settings"
import { Switch } from "@opencode-ai/ui/switch"
import { SettingsList } from "./settings-list"

export const SettingsAnimations: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,color-mix(in_oklch,var(--surface-stronger-non-alpha)_92%,transparent)_calc(100%_-_24px),transparent)] backdrop-blur-md">
        <div class="flex flex-col gap-1 pt-6 pb-8">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.tab.animations")}</h2>
        </div>
      </div>

      <div class="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-1">
          <SettingsList>
            <div class="flex flex-wrap items-center gap-4 py-3.5 border-b border-border-weaker-base last:border-none sm:flex-nowrap">
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <span class="text-14-medium text-text-strong">{language.t("settings.animations.reduceMotion.title")}</span>
                <span class="text-12-regular text-text-weak leading-5">{language.t("settings.animations.reduceMotion.description")}</span>
              </div>
              <div class="flex w-full justify-end sm:w-auto sm:shrink-0">
                <Switch
                  checked={settings.animations.reduceMotion()}
                  onChange={(checked) => settings.animations.setReduceMotion(checked)}
                />
              </div>
            </div>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}
