#!/usr/bin/env bash
# Installerar Changes: loggtjänsten och GNOME-menyn. Kör som vanlig användare, inte som root.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
UUID="changes-menu@sh0ken.local"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

if [ "$(id -u)" -eq 0 ]; then
    echo "Kör inte som root. Kör som vanlig användare." >&2
    exit 1
fi

mkdir -p "$HOME/.local/bin" "$HOME/.config/systemd/user" "$EXT_DIR" "$HOME/.local/state/changes"

install -m 755 "$HERE/bin/changes-watch" "$HOME/.local/bin/changes-watch"
install -m 644 "$HERE/systemd/changes-watch.service" "$HOME/.config/systemd/user/changes-watch.service"
install -m 644 "$HERE/extension@changes-menu/extension.js" "$EXT_DIR/extension.js"
install -m 644 "$HERE/extension@changes-menu/metadata.json" "$EXT_DIR/metadata.json"

systemctl --user daemon-reload
systemctl --user enable --now changes-watch.service

# Aktivera menyn (GNOME 45+ läser listan i gsettings)
CUR="$(gsettings get org.gnome.shell enabled-extensions)"
if ! grep -q "$UUID" <<<"$CUR"; then
    NEW="$(python3 -c "import ast,sys; l=ast.literal_eval(sys.argv[1]); l.append(sys.argv[2]); print(l)" "$CUR" "$UUID")"
    gsettings set org.gnome.shell enabled-extensions "$NEW"
fi

echo
echo "Klart. Ladda om GNOME en gång: tryck Alt+F2, skriv r och tryck Enter (X11)."
echo "På Wayland: logga ut och in igen."
