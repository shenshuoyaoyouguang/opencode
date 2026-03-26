import { type Component, type JSX } from "solid-js"

export const SettingsList: Component<{ children: JSX.Element }> = (props) => {
  return (
    <div class="rounded-xl border border-border-weak-base bg-[color:color-mix(in_oklch,var(--surface-raised-base)_84%,transparent)] px-4 shadow-xs-border-base backdrop-blur-xl">
      {props.children}
    </div>
  )
}
