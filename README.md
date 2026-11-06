# IndicatorVisibilityTool

IndicatorVisibilityTool controls the visibility of selected system indicators shown beside GNOME Shell's Quick Settings button in the top panel. It changes indicator visibility only; it does not disable the corresponding system features or Quick Settings controls.

## Compatibility and requirements

- GNOME Shell 45 through 51, as declared in [`metadata.json`](./metadata.json).
- Fedora 45 with GNOME Shell 51.1 is supported.
- The extension uses GNOME Shell's Quick Settings indicator objects. No third-party GNOME extension is required.
- The preferences use GTK 4 and libadwaita, which are provided by the GNOME desktop. The extension's GSettings schema is included in `schemas/`.

## Indicators

The preferences can control these indicators when they are available in the current Shell session:

- System/battery
- Unsafe mode
- Output volume
- RFKill
- Bluetooth
- Network
- Night Light
- Thunderbolt
- Location
- Input volume
- Camera
- Remote access

The Shell may omit an indicator when its related hardware or service is unavailable.

## Installation

From a checkout of this repository, create and install the extension bundle:

```sh
gnome-extensions pack --out-dir "$HOME" "$PWD"
gnome-extensions install --force "$HOME/IndicatorVisibilityTool@VirlesFelyard.shell-extension.zip"
gnome-extensions enable IndicatorVisibilityTool@VirlesFelyard
```

The `gnome-extensions` command is included with GNOME Shell. The extension installs under `~/.local/share/gnome-shell/extensions/IndicatorVisibilityTool@VirlesFelyard/`.

## Configuration and use

Open the preferences from the Extensions app, or run:

```sh
gnome-extensions prefs IndicatorVisibilityTool@VirlesFelyard
```

Choose **Default** to return an indicator to GNOME Shell's normal visibility behavior, **Shown** to force it visible, or **Hidden** to hide it. Changes take effect immediately and remain saved if the extension is disabled. Disabling the extension restores GNOME-managed visibility.

If you edit the GSettings schema, regenerate its compiled form before packaging:

```sh
glib-compile-schemas schemas
```
