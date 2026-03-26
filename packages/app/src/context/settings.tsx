import { createStore, reconcile } from "solid-js/store"
import { createEffect, createMemo } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { persisted } from "@/utils/persist"

export interface NotificationSettings {
  agent: boolean
  permissions: boolean
  errors: boolean
}

export interface SoundSettings {
  agentEnabled: boolean
  agent: string
  permissionsEnabled: boolean
  permissions: string
  errorsEnabled: boolean
  errors: string
}

export type AnimationSpeed = "slow" | "normal" | "fast" | "none"
export type InterfaceDensity = "compact" | "normal" | "comfortable"
export type SidebarPosition = "left" | "right"
export type MessageAlignment = "left" | "center"

export interface LayoutSettings {
  sidebarPosition: SidebarPosition
  sidebarWidth: number
  messageWidth: number
  messageAlignment: MessageAlignment
  showAgentMetadata: boolean
  showTimestamps: boolean
  showAvatar: boolean
  collapseSystemMessages: boolean
}

export interface AnimationSettings {
  speed: AnimationSpeed
  enableTransitions: boolean
  enableScrollAnimations: boolean
  reduceMotion: boolean
}

export interface Settings {
  general: {
    autoSave: boolean
    releaseNotes: boolean
    followup: "queue" | "steer"
    showReasoningSummaries: boolean
    showCustomHookParts: boolean
    shellToolPartsExpanded: boolean
    editToolPartsExpanded: boolean
  }
  updates: {
    startup: boolean
  }
  appearance: {
    fontSize: number
    font: string
    zoomLevel: number
    contentWidth: number
    interfaceDensity: InterfaceDensity
    lineHeight: number
    letterSpacing: number
    borderRadius: number
  }
  layout: LayoutSettings
  animations: AnimationSettings
  keybinds: Record<string, string>
  permissions: {
    autoApprove: boolean
  }
  notifications: NotificationSettings
  sounds: SoundSettings
}

const defaultSettings: Settings = {
  general: {
    autoSave: true,
    releaseNotes: true,
    followup: "steer",
    showReasoningSummaries: false,
    showCustomHookParts: true,
    shellToolPartsExpanded: true,
    editToolPartsExpanded: false,
  },
  updates: {
    startup: true,
  },
  appearance: {
    fontSize: 14,
    font: "ibm-plex-mono",
    zoomLevel: 1,
    contentWidth: 300,
    interfaceDensity: "normal",
    lineHeight: 1.5,
    letterSpacing: 0,
    borderRadius: 8,
  },
  layout: {
    sidebarPosition: "left",
    sidebarWidth: 280,
    messageWidth: 100,
    messageAlignment: "center",
    showAgentMetadata: true,
    showTimestamps: true,
    showAvatar: true,
    collapseSystemMessages: false,
  },
  animations: {
    speed: "normal",
    enableTransitions: true,
    enableScrollAnimations: true,
    reduceMotion: false,
  },
  keybinds: {},
  permissions: {
    autoApprove: false,
  },
  notifications: {
    agent: true,
    permissions: true,
    errors: false,
  },
  sounds: {
    agentEnabled: true,
    agent: "staplebops-01",
    permissionsEnabled: true,
    permissions: "staplebops-02",
    errorsEnabled: true,
    errors: "nope-03",
  },
}

const monoFallback =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

const monoFonts: Record<string, string> = {
  "ibm-plex-mono": `"IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "cascadia-code": `"Cascadia Code Nerd Font", "Cascadia Code NF", "Cascadia Mono NF", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "fira-code": `"Fira Code Nerd Font", "FiraMono Nerd Font", "FiraMono Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  hack: `"Hack Nerd Font", "Hack Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  inconsolata: `"Inconsolata Nerd Font", "Inconsolata Nerd Font Mono","IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "intel-one-mono": `"Intel One Mono Nerd Font", "IntoneMono Nerd Font", "IntoneMono Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  iosevka: `"Iosevka Nerd Font", "Iosevka Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "jetbrains-mono": `"JetBrains Mono Nerd Font", "JetBrainsMono Nerd Font Mono", "JetBrainsMonoNL Nerd Font", "JetBrainsMonoNL Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "meslo-lgs": `"Meslo LGS Nerd Font", "MesloLGS Nerd Font", "MesloLGM Nerd Font", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "roboto-mono": `"Roboto Mono Nerd Font", "RobotoMono Nerd Font", "RobotoMono Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "source-code-pro": `"Source Code Pro Nerd Font", "SauceCodePro Nerd Font", "SauceCodePro Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "ubuntu-mono": `"Ubuntu Mono Nerd Font", "UbuntuMono Nerd Font", "UbuntuMono Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
  "geist-mono": `"GeistMono Nerd Font", "GeistMono Nerd Font Mono", "IBM Plex Mono", "IBM Plex Mono Fallback", ${monoFallback}`,
}

export function monoFontFamily(font: string | undefined) {
  return monoFonts[font ?? defaultSettings.appearance.font] ?? monoFonts[defaultSettings.appearance.font]
}

function withFallback<T>(read: () => T | undefined, fallback: T) {
  return createMemo(() => read() ?? fallback)
}

let font: Promise<typeof import("@opencode-ai/ui/font-loader")> | undefined

function loadFont() {
  font ??= import("@opencode-ai/ui/font-loader")
  return font
}

export const { use: useSettings, provider: SettingsProvider } = createSimpleContext({
  name: "Settings",
  init: () => {
    const [store, setStore, _, ready] = persisted("settings.v3", createStore<Settings>(defaultSettings))

    createEffect(() => {
      if (typeof document === "undefined") return
      const id = store.appearance?.font ?? defaultSettings.appearance.font
      if (id !== defaultSettings.appearance.font) {
        void loadFont().then((x) => x.ensureMonoFont(id))
      }
      document.documentElement.style.setProperty("--font-family-mono", monoFontFamily(id))
    })

    createEffect(() => {
      if (typeof document === "undefined") return
      const fontSize = store.appearance?.fontSize ?? defaultSettings.appearance.fontSize
      document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`)
    })

    createEffect(() => {
      if (typeof document === "undefined") return
      const width = store.appearance?.contentWidth ?? defaultSettings.appearance.contentWidth
      // Apply 0.8 scaling factor to reduce default width (1200px -> 960px)
      const effectiveWidth = width * 0.8
      // Convert to rem units (width units are in 0.25rem spacing scale)
      document.documentElement.style.setProperty("--session-content-width", `${effectiveWidth * 0.25}rem`)
    })

    // Interface density effect
    createEffect(() => {
      if (typeof document === "undefined") return
      const density = store.appearance?.interfaceDensity ?? defaultSettings.appearance.interfaceDensity
      document.documentElement.dataset.density = density
      const spacing = density === "compact" ? "0.5rem" : density === "comfortable" ? "1.25rem" : "0.875rem"
      document.documentElement.style.setProperty("--ui-spacing", spacing)
    })

    // Line height effect
    createEffect(() => {
      if (typeof document === "undefined") return
      const lineHeight = store.appearance?.lineHeight ?? defaultSettings.appearance.lineHeight
      document.documentElement.style.setProperty("--line-height", String(lineHeight))
    })

    // Letter spacing effect
    createEffect(() => {
      if (typeof document === "undefined") return
      const letterSpacing = store.appearance?.letterSpacing ?? defaultSettings.appearance.letterSpacing
      document.documentElement.style.setProperty("--letter-spacing", `${letterSpacing}px`)
    })

    // Border radius effect
    createEffect(() => {
      if (typeof document === "undefined") return
      const borderRadius = store.appearance?.borderRadius ?? defaultSettings.appearance.borderRadius
      document.documentElement.style.setProperty("--border-radius", `${borderRadius}px`)
    })

    // Animation effects
    createEffect(() => {
      if (typeof document === "undefined") return
      const speed = store.animations?.speed ?? defaultSettings.animations.speed
      const enableTransitions = store.animations?.enableTransitions ?? defaultSettings.animations.enableTransitions
      const reduceMotion = store.animations?.reduceMotion ?? defaultSettings.animations.reduceMotion

      // Apply animation speed
      const duration = speed === "slow" ? "0.5s" : speed === "fast" ? "0.15s" : "0.3s"
      document.documentElement.style.setProperty("--transition-duration", duration)
      document.documentElement.style.setProperty("--animation-speed", speed)

      // Apply reduced motion preference
      if (reduceMotion) {
        document.documentElement.classList.add("reduce-motion")
      } else {
        document.documentElement.classList.remove("reduce-motion")
      }

      // Disable transitions if needed
      if (!enableTransitions) {
        document.documentElement.classList.add("disable-transitions")
      } else {
        document.documentElement.classList.remove("disable-transitions")
      }
    })

    // Layout effects
    createEffect(() => {
      if (typeof document === "undefined") return
      const sidebarPosition = store.layout?.sidebarPosition ?? defaultSettings.layout.sidebarPosition
      document.documentElement.dataset.sidebarPosition = sidebarPosition
      document.documentElement.style.setProperty("--sidebar-position", sidebarPosition === "right" ? "1" : "0")
    })

    createEffect(() => {
      if (typeof document === "undefined") return
      const messageWidth = store.layout?.messageWidth ?? defaultSettings.layout.messageWidth
      document.documentElement.style.setProperty("--message-width", `${messageWidth}%`)
    })

    return {
      ready,
      get current() {
        return store
      },
      general: {
        autoSave: withFallback(() => store.general?.autoSave, defaultSettings.general.autoSave),
        setAutoSave(value: boolean) {
          setStore("general", "autoSave", value)
        },
        releaseNotes: withFallback(() => store.general?.releaseNotes, defaultSettings.general.releaseNotes),
        setReleaseNotes(value: boolean) {
          setStore("general", "releaseNotes", value)
        },
        followup: withFallback(() => store.general?.followup, defaultSettings.general.followup),
        setFollowup(value: "queue" | "steer") {
          setStore("general", "followup", value)
        },
        showReasoningSummaries: withFallback(
          () => store.general?.showReasoningSummaries,
          defaultSettings.general.showReasoningSummaries,
        ),
        setShowReasoningSummaries(value: boolean) {
          setStore("general", "showReasoningSummaries", value)
        },
        showCustomHookParts: withFallback(
          () => store.general?.showCustomHookParts,
          defaultSettings.general.showCustomHookParts,
        ),
        setShowCustomHookParts(value: boolean) {
          setStore("general", "showCustomHookParts", value)
        },
        shellToolPartsExpanded: withFallback(
          () => store.general?.shellToolPartsExpanded,
          defaultSettings.general.shellToolPartsExpanded,
        ),
        setShellToolPartsExpanded(value: boolean) {
          setStore("general", "shellToolPartsExpanded", value)
        },
        editToolPartsExpanded: withFallback(
          () => store.general?.editToolPartsExpanded,
          defaultSettings.general.editToolPartsExpanded,
        ),
        setEditToolPartsExpanded(value: boolean) {
          setStore("general", "editToolPartsExpanded", value)
        },
      },
      updates: {
        startup: withFallback(() => store.updates?.startup, defaultSettings.updates.startup),
        setStartup(value: boolean) {
          setStore("updates", "startup", value)
        },
      },
      appearance: {
        fontSize: withFallback(() => store.appearance?.fontSize, defaultSettings.appearance.fontSize),
        setFontSize(value: number) {
          setStore("appearance", "fontSize", value)
        },
        font: withFallback(() => store.appearance?.font, defaultSettings.appearance.font),
        setFont(value: string) {
          setStore("appearance", "font", value)
        },
        zoomLevel: createMemo(() => store.appearance?.zoomLevel ?? defaultSettings.appearance.zoomLevel),
        setZoomLevel(value: number) {
          setStore("appearance", "zoomLevel", value)
        },
        contentWidth: createMemo(() => store.appearance?.contentWidth ?? defaultSettings.appearance.contentWidth),
        setContentWidth(value: number) {
          setStore("appearance", "contentWidth", value)
        },
        interfaceDensity: withFallback(
          () => store.appearance?.interfaceDensity,
          defaultSettings.appearance.interfaceDensity,
        ),
        setInterfaceDensity(value: InterfaceDensity) {
          setStore("appearance", "interfaceDensity", value)
        },
        lineHeight: withFallback(() => store.appearance?.lineHeight, defaultSettings.appearance.lineHeight),
        setLineHeight(value: number) {
          setStore("appearance", "lineHeight", value)
        },
        letterSpacing: withFallback(() => store.appearance?.letterSpacing, defaultSettings.appearance.letterSpacing),
        setLetterSpacing(value: number) {
          setStore("appearance", "letterSpacing", value)
        },
        borderRadius: withFallback(() => store.appearance?.borderRadius, defaultSettings.appearance.borderRadius),
        setBorderRadius(value: number) {
          setStore("appearance", "borderRadius", value)
        },
      },
      layout: {
        sidebarPosition: withFallback(() => store.layout?.sidebarPosition, defaultSettings.layout.sidebarPosition),
        setSidebarPosition(value: SidebarPosition) {
          setStore("layout", "sidebarPosition", value)
        },
        sidebarWidth: withFallback(() => store.layout?.sidebarWidth, defaultSettings.layout.sidebarWidth),
        setSidebarWidth(value: number) {
          setStore("layout", "sidebarWidth", value)
        },
        messageWidth: withFallback(() => store.layout?.messageWidth, defaultSettings.layout.messageWidth),
        setMessageWidth(value: number) {
          setStore("layout", "messageWidth", value)
        },
        messageAlignment: withFallback(() => store.layout?.messageAlignment, defaultSettings.layout.messageAlignment),
        setMessageAlignment(value: MessageAlignment) {
          setStore("layout", "messageAlignment", value)
        },
        showAgentMetadata: withFallback(() => store.layout?.showAgentMetadata, defaultSettings.layout.showAgentMetadata),
        setShowAgentMetadata(value: boolean) {
          setStore("layout", "showAgentMetadata", value)
        },
        showTimestamps: withFallback(() => store.layout?.showTimestamps, defaultSettings.layout.showTimestamps),
        setShowTimestamps(value: boolean) {
          setStore("layout", "showTimestamps", value)
        },
        showAvatar: withFallback(() => store.layout?.showAvatar, defaultSettings.layout.showAvatar),
        setShowAvatar(value: boolean) {
          setStore("layout", "showAvatar", value)
        },
        collapseSystemMessages: withFallback(
          () => store.layout?.collapseSystemMessages,
          defaultSettings.layout.collapseSystemMessages,
        ),
        setCollapseSystemMessages(value: boolean) {
          setStore("layout", "collapseSystemMessages", value)
        },
      },
      animations: {
        speed: withFallback(() => store.animations?.speed, defaultSettings.animations.speed),
        setSpeed(value: AnimationSpeed) {
          setStore("animations", "speed", value)
        },
        enableTransitions: withFallback(
          () => store.animations?.enableTransitions,
          defaultSettings.animations.enableTransitions,
        ),
        setEnableTransitions(value: boolean) {
          setStore("animations", "enableTransitions", value)
        },
        enableScrollAnimations: withFallback(
          () => store.animations?.enableScrollAnimations,
          defaultSettings.animations.enableScrollAnimations,
        ),
        setEnableScrollAnimations(value: boolean) {
          setStore("animations", "enableScrollAnimations", value)
        },
        reduceMotion: withFallback(() => store.animations?.reduceMotion, defaultSettings.animations.reduceMotion),
        setReduceMotion(value: boolean) {
          setStore("animations", "reduceMotion", value)
        },
      },
      keybinds: {
        get: (action: string) => store.keybinds?.[action],
        set(action: string, keybind: string) {
          setStore("keybinds", action, keybind)
        },
        reset(action: string) {
          setStore("keybinds", (current) => {
            if (!Object.prototype.hasOwnProperty.call(current, action)) return current
            const next = { ...current }
            delete next[action]
            return next
          })
        },
        resetAll() {
          setStore("keybinds", reconcile({}))
        },
      },
      permissions: {
        autoApprove: withFallback(() => store.permissions?.autoApprove, defaultSettings.permissions.autoApprove),
        setAutoApprove(value: boolean) {
          setStore("permissions", "autoApprove", value)
        },
      },
      notifications: {
        agent: withFallback(() => store.notifications?.agent, defaultSettings.notifications.agent),
        setAgent(value: boolean) {
          setStore("notifications", "agent", value)
        },
        permissions: withFallback(() => store.notifications?.permissions, defaultSettings.notifications.permissions),
        setPermissions(value: boolean) {
          setStore("notifications", "permissions", value)
        },
        errors: withFallback(() => store.notifications?.errors, defaultSettings.notifications.errors),
        setErrors(value: boolean) {
          setStore("notifications", "errors", value)
        },
      },
      sounds: {
        agentEnabled: withFallback(() => store.sounds?.agentEnabled, defaultSettings.sounds.agentEnabled),
        setAgentEnabled(value: boolean) {
          setStore("sounds", "agentEnabled", value)
        },
        agent: withFallback(() => store.sounds?.agent, defaultSettings.sounds.agent),
        setAgent(value: string) {
          setStore("sounds", "agent", value)
        },
        permissionsEnabled: withFallback(
          () => store.sounds?.permissionsEnabled,
          defaultSettings.sounds.permissionsEnabled,
        ),
        setPermissionsEnabled(value: boolean) {
          setStore("sounds", "permissionsEnabled", value)
        },
        permissions: withFallback(() => store.sounds?.permissions, defaultSettings.sounds.permissions),
        setPermissions(value: string) {
          setStore("sounds", "permissions", value)
        },
        errorsEnabled: withFallback(() => store.sounds?.errorsEnabled, defaultSettings.sounds.errorsEnabled),
        setErrorsEnabled(value: boolean) {
          setStore("sounds", "errorsEnabled", value)
        },
        errors: withFallback(() => store.sounds?.errors, defaultSettings.sounds.errors),
        setErrors(value: string) {
          setStore("sounds", "errors", value)
        },
      },
    }
  },
})
