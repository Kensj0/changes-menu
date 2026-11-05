// Changes-meny: visar de senaste filerna som changes-watch har loggat.
// Läser loggen först när menyn öppnas, så ingen bakgrundsbelastning.

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const LOG_PATH = GLib.build_filenamev([GLib.get_home_dir(), '.local', 'state', 'changes', 'log.txt']);
const SHOW_COUNT = 20;

const ChangesButton = GObject.registerClass(
class ChangesButton extends PanelMenu.Button {
    _init() {
        super._init(0.5, 'Changes');
        this.add_child(new St.Label({
            text: 'Changes',
            y_align: Clutter.ActorAlign.CENTER,
        }));
        this._rebuild();
        this.menu.connect('open-state-changed', (menu, isOpen) => {
            if (isOpen)
                this._rebuild();
        });

    }

    _readEntries() {
        try {
            const [ok, contents] = GLib.file_get_contents(LOG_PATH);
            if (!ok)
                return [];
            const lines = new TextDecoder().decode(contents).split('\n');
            const entries = [];
            for (const line of lines) {
                const tab = line.indexOf('\t');
                if (tab > 0)
                    entries.push({time: line.slice(0, tab), path: line.slice(tab + 1)});
            }
            // Senaste först, bara filer som fortfarande finns
            return entries
                .reverse()
                .filter(e => GLib.file_test(e.path, GLib.FileTest.EXISTS))
                .slice(0, SHOW_COUNT);
        } catch (e) {
            return [];
        }
    }

    _rebuild() {
        this.menu.removeAll();
        const entries = this._readEntries();

        if (entries.length === 0) {
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem('Inga filer ännu', {reactive: false}));
        }

        for (const entry of entries) {
            const item = new PopupMenu.PopupBaseMenuItem();
            const box = new St.BoxLayout({vertical: true, x_expand: true});
            box.add_child(new St.Label({
                text: GLib.path_get_basename(entry.path),
            }));
            const timeLabel = new St.Label({
                text: entry.time,
                style: 'font-size: 0.75em; opacity: 0.6;',
            });
            box.add_child(timeLabel);
            item.add_child(box);

            // Klick öppnar mappen som filen ligger i
            item.connect('activate', () => {
                const folder = Gio.File.new_for_path(GLib.path_get_dirname(entry.path));
                Gio.AppInfo.launch_default_for_uri(folder.get_uri(), null);
            });
            this.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const clear = new PopupMenu.PopupMenuItem('Töm lista');
        clear.connect('activate', () => {
            try {
                GLib.file_set_contents(LOG_PATH, '');
            } catch (e) {
                console.log(`[Changes] Kunde inte tömma loggen: ${e}`);
            }
        });
        this.menu.addMenuItem(clear);
    }
});

export default class ChangesMenuExtension extends Extension {
    enable() {
        this._button = new ChangesButton();
        Main.panel.addToStatusArea(this.uuid, this._button, Main.sessionMode.panel.left.length, 'left');
    }

    disable() {
        this._button?.destroy();
        this._button = null;
    }
}
