# Changes

En liten meny i GNOME:s panel som visar de senaste filerna du sparat eller laddat ner, till exempel nedladdningar från webbläsaren, torrents eller en ny textfil.

- Listan visar de **20 senaste** filerna, nyast först.
- Under varje filnamn står datum och tid i liten text.
- Klicka på en fil för att öppna mappen den ligger i.
- **Töm lista** rensar loggen.

## Så fungerar det

Två delar:

1. **`changes-watch`** är en bakgrundstjänst (Python, inget extra paket). Den använder Linux inotify och sover tills något sparas, så den använder nästan ingen CPU. Den bevakar hemkatalogen men hoppar över dolda mappar (de som börjar med punkt), cache-mappar och ofullständiga nedladdningar (`.crdownload`, `.part`). Varje händelse läggs som en rad i `~/.local/state/changes/log.txt`, och loggen trimmas automatiskt.
2. **GNOME-tillägget** läser loggen när menyn öppnas. Ingen bakgrundsläsning sker.

## Krav

- GNOME Shell 45–51 (testat på 46, X11)
- Python 3
- systemd (användartjänster)

## Installera

```bash
git clone https://github.com/Kensj0/changes-menu.git
cd changes-menu
./install.sh
```

Skriptet kopierar filerna till `~/.local/bin`, `~/.config/systemd/user` och `~/.local/share/gnome-shell/extensions/`, startar tjänsten och aktiverar tillägget.

Ladda sedan om GNOME en gång:
- **X11:** tryck Alt+F2, skriv `r` och tryck Enter.
- **Wayland:** logga ut och in igen.

## Avinstallera

```bash
systemctl --user disable --now changes-watch.service
rm ~/.local/bin/changes-watch ~/.config/systemd/user/changes-watch.service
rm -r ~/.local/share/gnome-shell/extensions/changes-menu@sh0ken.local ~/.local/state/changes
```

Ta sedan bort `changes-menu@sh0ken.local` från listan `enabled-extensions` i gsettings, eller stäng av det i tilläggsappen.

## Anpassa

- **Vilka mappar som bevakas:** `SKIP_REL` och `SKIP_NAMES` i `bin/changes-watch`. Starta om med `systemctl --user restart changes-watch`.
- **Antal filer i menyn:** `SHOW_COUNT` i `extension.js`.

## Felsökning

- Se tjänstens status: `systemctl --user status changes-watch`
- Se loggen: `cat ~/.local/state/changes/log.txt`
- Se fel från tillägget: `journalctl --user -b | grep -i changes`

GNOME cachar tilläggets kod tills skalet startar om, så efter ändringar i `extension.js` måste du alltid ladda om GNOME.
