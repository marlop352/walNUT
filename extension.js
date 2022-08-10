/*
 * walNUT: A Gnome Shell Extension for NUT (Network UPS Tools)
 *
 * Copyright (C)
 *   2013 Daniele Pezzini <hyouko@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */

const	Atk = imports.gi.Atk,
	Clutter = imports.gi.Clutter,
	Config = imports.misc.config,
	Gio = imports.gi.Gio,
	GObject = imports.gi.GObject,
	Lang = imports.lang,
	Main = imports.ui.main,
	Mainloop = imports.mainloop,
	ModalDialog = imports.ui.modalDialog,
	PanelMenu = imports.ui.panelMenu,
	Pango = imports.gi.Pango,
	PopupMenu = imports.ui.popupMenu,
	ShellEntry = imports.ui.shellEntry,
	Slider = imports.ui.slider,
	St = imports.gi.St,
	Tweener = imports.tweener.tweener,
	Util = imports.misc.util;

// Gettext
const	Gettext = imports.gettext.domain('gnome-shell-extensions-walnut'),
	_ = Gettext.gettext;

const	Me = imports.misc.extensionUtils.getCurrentExtension(),
	Convenience = Me.imports.convenience,
	// Import GJS implementation of NUT's net protocol
	Nut = Me.imports.nut,
	// Import utilities.js
	Utilities = Me.imports.utilities;

// Panel Icons
const	PanelIcons = {
	// Error = E
	E:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-error-symbolic.svg'),

	// Battery	| Load
	// full = 2	| full = 23
	// good = 3	| good = 17
	// low = 5	| low = 13
	// empty = 7	| empty = 11
	// no battery/no load = 1
	// +: lightning = online (= status OL = not on battery (OB = B) = mains is not absent): full opacity = charging => O | transparent = charged => C
	// +: ! = caution (ALARM, BYPASS, OVER, RB..) => A

	// status = OB (-> B) - no caution
	// no battery/no load -> 1
	B1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ob-symbolic.svg'),
	//	battery full -> 2
	B2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-symbolic.svg'),
	B46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-symbolic.svg'),
	B34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-symbolic.svg'),
	B26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-symbolic.svg'),
	B22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-symbolic.svg'),
	//	battery good -> 3
	B3:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-symbolic.svg'),
	B69:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-full-symbolic.svg'),
	B51:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-good-symbolic.svg'),
	B39:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-low-symbolic.svg'),
	B33:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-empty-symbolic.svg'),
	//	battery low -> 5
	B5:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-symbolic.svg'),
	B115:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-full-symbolic.svg'),
	B85:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-good-symbolic.svg'),
	B65:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-low-symbolic.svg'),
	B55:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-empty-symbolic.svg'),
	//	battery empty -> 7
	B7:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-symbolic.svg'),
	B161:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-full-symbolic.svg'),
	B119:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-good-symbolic.svg'),
	B91:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-low-symbolic.svg'),
	B77:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-symbolic.svg'),
	// just load
	//	load full -> 23
	B23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-symbolic.svg'),
	//	load good -> 17
	B17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-symbolic.svg'),
	//	load low -> 13
	B13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-symbolic.svg'),
	//	load empty -> 11
	B11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-symbolic.svg'),

	// status = OB (->B) - caution (->A)
	// no battery/no load -> 1
	BA1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ob-caution-symbolic.svg'),
	//	battery full -> 2
	BA2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-caution-symbolic.svg'),
	BA46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-caution-symbolic.svg'),
	BA34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-caution-symbolic.svg'),
	BA26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-caution-symbolic.svg'),
	BA22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-caution-symbolic.svg'),
	//	battery good -> 3
	BA3:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-caution-symbolic.svg'),
	BA69:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-full-caution-symbolic.svg'),
	BA51:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-good-caution-symbolic.svg'),
	BA39:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-low-caution-symbolic.svg'),
	BA33:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-empty-caution-symbolic.svg'),
	//	battery low -> 5
	BA5:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-caution-symbolic.svg'),
	BA115:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-full-caution-symbolic.svg'),
	BA85:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-good-caution-symbolic.svg'),
	BA65:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-low-caution-symbolic.svg'),
	BA55:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-empty-caution-symbolic.svg'),
	//	battery empty -> 7
	BA7:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-caution-symbolic.svg'),
	BA161:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-full-caution-symbolic.svg'),
	BA119:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-good-caution-symbolic.svg'),
	BA91:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-low-caution-symbolic.svg'),
	BA77:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-caution-symbolic.svg'),
	// just load
	//	load full -> 23
	BA23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-caution-symbolic.svg'),
	//	load good -> 17
	BA17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-caution-symbolic.svg'),
	//	load low -> 13
	BA13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-caution-symbolic.svg'),
	//	load empty -> 11
	BA11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-caution-symbolic.svg'),

	// status = OL (->O[+C])
	// no battery/no load -> 1
	OC1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ol-charged-symbolic.svg'),
	O1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ol-charging-symbolic.svg'),
	//	battery full -> 2
	OC2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-charged-symbolic.svg'),
	O2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-charging-symbolic.svg'),
	OC46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-charged-symbolic.svg'),
	O46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-charging-symbolic.svg'),
	OC34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-charged-symbolic.svg'),
	O34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-charging-symbolic.svg'),
	OC26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-charged-symbolic.svg'),
	O26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-charging-symbolic.svg'),
	OC22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-charged-symbolic.svg'),
	O22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-charging-symbolic.svg'),
	//	battery good -> 3
	O3:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-charging-symbolic.svg'),
	O69:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-full-charging-symbolic.svg'),
	O51:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-good-charging-symbolic.svg'),
	O39:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-low-charging-symbolic.svg'),
	O33:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-empty-charging-symbolic.svg'),
	//	battery low -> 5
	O5:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-charging-symbolic.svg'),
	O115:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-full-charging-symbolic.svg'),
	O85:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-good-charging-symbolic.svg'),
	O65:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-low-charging-symbolic.svg'),
	O55:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-empty-charging-symbolic.svg'),
	//	battery empty -> 7
	O7:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-charging-symbolic.svg'),
	O161:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-full-charging-symbolic.svg'),
	O119:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-good-charging-symbolic.svg'),
	O91:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-low-charging-symbolic.svg'),
	O77:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-charging-symbolic.svg'),
	// just load
	//	load full -> 23
	OC23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-charged-symbolic.svg'),
	O23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-charging-symbolic.svg'),
	//	load good -> 17
	OC17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-charged-symbolic.svg'),
	O17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-charging-symbolic.svg'),
	//	load low -> 13
	OC13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-charged-symbolic.svg'),
	O13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-charging-symbolic.svg'),
	//	load empty -> 11
	OC11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-charged-symbolic.svg'),
	O11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-charging-symbolic.svg'),

	// status = OL (->O[+C]) - caution (->A)
	// no battery/no load ->
	OAC1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ol-caution-charged-symbolic.svg'),
	OA1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-ghost-ol-caution-charging-symbolic.svg'),
	//	battery full -> 2
	OAC2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-caution-charged-symbolic.svg'),
	OA2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-caution-charging-symbolic.svg'),
	OAC46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-caution-charged-symbolic.svg'),
	OA46:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-full-caution-charging-symbolic.svg'),
	OAC34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-caution-charged-symbolic.svg'),
	OA34:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-good-caution-charging-symbolic.svg'),
	OAC26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-caution-charged-symbolic.svg'),
	OA26:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-low-caution-charging-symbolic.svg'),
	OAC22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-caution-charged-symbolic.svg'),
	OA22:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-full-load-empty-caution-charging-symbolic.svg'),
	//	battery good -> 3
	OA3:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-caution-charging-symbolic.svg'),
	OA69:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-full-caution-charging-symbolic.svg'),
	OA51:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-good-caution-charging-symbolic.svg'),
	OA39:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-low-caution-charging-symbolic.svg'),
	OA33:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-good-load-empty-caution-charging-symbolic.svg'),
	//	battery low -> 5
	OA5:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-caution-charging-symbolic.svg'),
	OA115:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-full-caution-charging-symbolic.svg'),
	OA85:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-good-caution-charging-symbolic.svg'),
	OA65:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-low-caution-charging-symbolic.svg'),
	OA55:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-low-load-empty-caution-charging-symbolic.svg'),
	//	battery empty -> 7
	OA7:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-caution-charging-symbolic.svg'),
	OA161:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-full-caution-charging-symbolic.svg'),
	OA119:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-good-caution-charging-symbolic.svg'),
	OA91:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-load-low-caution-charging-symbolic.svg'),
	OA77:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-empty-caution-charging-symbolic.svg'),
	// just load
	//	load full -> 23
	OAC23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-caution-charged-symbolic.svg'),
	OA23:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-full-caution-charging-symbolic.svg'),
	//	load good -> 17
	OAC17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-caution-charged-symbolic.svg'),
	OA17:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-good-caution-charging-symbolic.svg'),
	//	load low -> 13
	OAC13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-caution-charged-symbolic.svg'),
	OA13:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-low-caution-charging-symbolic.svg'),
	//	load empty -> 11
	OAC11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-caution-charged-symbolic.svg'),
	OA11:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/nut-battery-na-load-empty-caution-charging-symbolic.svg')
}

// Battery icon @ menu
const	BatteryIcon = {
	B1:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-battery-missing-symbolic.svg'),
	B2:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-battery-full-symbolic.svg'),
	B3:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-battery-good-symbolic.svg'),
	B5:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-battery-low-symbolic.svg'),
	B7:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-battery-empty-symbolic.svg')
}

// Other icons
const	MiscIcons = {
	Error:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-dialog-error-symbolic.svg'),
	OK:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/actions/imported-emblem-ok-symbolic.svg'),
	Cancel:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/actions/imported-window-close-symbolic.svg'),
	Plus:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/actions/imported-list-add-symbolic.svg'),
	Minus:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/actions/imported-list-remove-symbolic.svg'),
	Preferences:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/categories/imported-preferences-system-symbolic.svg'),
	Credentials:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/categories/imported-dialog-password-symbolic.svg'),
	FindDevices:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/categories/imported-edit-find-symbolic.svg'),
	DeleteDevice:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/categories/imported-user-trash-symbolic.svg'),
	Help:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/categories/imported-help-browser-symbolic.svg'),
	DeviceStatus:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/emblems/imported-utilities-system-monitor-symbolic.svg'),
	Alarm:		Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/status/imported-dialog-warning-symbolic.svg'),
	DeviceLoad:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/emblems/imported-system-run-symbolic.svg'),
	BackupTime:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/emblems/imported-preferences-system-time-symbolic.svg'),
	DeviceTemp:	Gio.icon_new_for_string(Me.path + '/icons/gnome/scalable/emblems/nut-thermometer-symbolic.svg')
}

// Errors
const	ErrorType = {
	UPS_NA: 2,	// 'Chosen' UPS is not available
	NO_UPS: 4,	// No device found
}

// Max length (in chars)
const	Lengths = {
	ERR_LABEL: 35,	// ErrorBox Label
	ERR_DESC: 35,	// ErrorBox Description
	MODEL: 40,	// Device manufacturer+model
	TOPDATA: 40,	// Topdata (status/alarm) description (2nd row)
	RAW_VAR: 35,	// Raw data list: variable's name
	RAW_VALUE: 40,	// Raw data list: variable's value
	CMD: 45,	// UPS commands list - description
	CRED_DIALOG: 60	// Credentials dialog description
}

// Interval in milliseconds after which the extension should update the availability of the stored devices (15 minutes)
const	INTERVAL = 900000;

// Raw data button ornament
const RawDataButtonOrnament = {
	NONE:	0,
	OPENED:	1,
	CLOSED:	2
};

// Data table items
// Supported data format: {
//	'<data identifier #1>': {
//		label: function that shall return the label to be shown in panel menu
//		gicon: GIcon of the icon to be shown in panel menu, if static,
//		       or function that will be called with the actual value of data and shall return the GIcon
//		value: function that will be called with the actual value of data and shall return the string to be shown in panel menu
//		gsetting: name of the gsetting that toggles the view of this type of data
//	},
//	'<data identifier #2>': {
//		...
//	},
//	...
// }
const	DataTableItems = {
	'battery.charge': {	// Battery charge
		// TRANSLATORS: Label of battery charge @ data table
		label: function() { return _("Battery Charge"); },
		gicon: function(value) { return BatteryIcon['B' + Utilities.parseBatteryLevel(value)]; },
		// TRANSLATORS: Battery charge level @ data table
		value: function(value) { return _("%s %").format(value); },
		gsetting: 'display-battery-charge'
	},
	'ups.load': {		// Device load
		// TRANSLATORS: Label of device load @ data table
		label: function() { return _("Device Load"); },
		gicon: MiscIcons.DeviceLoad,
		// TRANSLATORS: Device load level @ data table
		value: function(value) { return _("%s %").format(value); },
		gsetting: 'display-load-level'
	},
	'battery.runtime': {	// Backup time
		// TRANSLATORS: Label of estimated backup time @ data table
		label: function() { return _("Backup Time"); },
		gicon: MiscIcons.BackupTime,
		value: function(value) { return Utilities.parseTime(value); },
		gsetting: 'display-backup-time'
	},
	'ups.temperature': {	// Device temperature
		// TRANSLATORS: Label of device temperature @ data table
		label: function() { return _("Temperature"); },
		gicon: MiscIcons.DeviceTemp,
		value: function(value) { return Utilities.formatTemp(value); },
		gsetting: 'display-device-temperature'
	}
};

// UpscMonitor: get vars from NUT at a given interval and deliver infos
const	UpscMonitor = class {

	constructor() {

		// Actual status
		this._state = ErrorType.NO_UPS | ErrorType.UPS_NA;

		// Device list
		this._devices = [];
		this._prevDevices = [];

		// Here we'll store chosen UPS's variables
		this._vars = {};

		// Update devices
		this.update({ forceRefresh: true });

		// Get time between updates
		this._interval = gsettings.get_int('update-time');

		// Connect update on settings changed
		this._settingsChangedId = gsettings.connect('changed', Lang.bind(this, function() {

			// Update interval between updates
			this._interval = gsettings.get_int('update-time');

			// Remove timers
			if (this._timer)
				Mainloop.source_remove(this._timer);

			if (this._forceRefresh)
				Mainloop.source_remove(this._forceRefresh);

			// Update devices
			this.update({ forceRefresh: true });

			// Update infos
			this._updateTimer();

		}));

		this._updateTimer();

	}

	// Get available devices
	// if a host:port is given call a function to check whether new UPSes are found there and add them to the already listed ones
	// otherwise, get stored UPSes or if there's no stored UPS try to find new ones at localhost:3493
	// args = {
	//	hostname: hostname,
	//	port: port,
	//	notify: whether we have to notify new devices found/not found or not
	// }
	getDevices(args) {

		let host, port, notify;

		if (args) {
			host = args.hostname;
			port = args.port;
			notify = args.notify;
		}

		// Save actual devices
		this._prevDevices = JSON.parse(JSON.stringify(this._devices));

		let got = [];

		// Retrieve actual UPSes stored in schema
		let stored = gsettings.get_string('ups');

		// e.g.:
		//  got = [
		//	{
		//		name: 'name',
		//		host: 'host',
		//		port: 'port'
		//	},
		//	{
		//		name: 'name1',
		//		host: 'host1',
		//		port: 'port1',
		//		user: 'user1',
		//		pw: 'pw1'
		//	},
		//		...
		//  ]
		got = JSON.parse(!stored || stored == '' ? '[]' : stored);

		if (!got.length)
			this._state |= ErrorType.NO_UPS;

		// If list is empty we'll check localhost:3493
		if (!host && !got.length)
			host = 'localhost';
		if (!port && !got.length)
			port = '3493';

		if (host && port) {

			let client = new Nut.NUTHelper({
				host: host,
				port: port
			});

			client.listUPS({
				callback: Lang.bind(this, this._postGetDevices),
				opts: [	notify ]
			});

			return;

		}

		// No new UPS to search
		this._devices = got;

		// Check which stored UPS is available
		this._checkAll();

		this._state &= ~ErrorType.NO_UPS;

	}

	// Process the result of the *NUTHelper.listUPS()* function called by *this.getDevices()* and save found devices in schema and in *this._devices* as an array of objects:
	//  {
	//	name: upsname,
	//	host: upshostname,
	//	port: upsport,
	//	user: username,
	//	pw: password
	//  }
	// then call *this._checkAll()* to fill the devices list with the availability of each stored UPS
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	opts: optional data passed to the callback function, i.e. [ *notify* ],
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = {
	//	'ups #1 name': 'ups #1's description',
	//	'ups #1 name': 'ups #2's description',
	//		...
	// }
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_postGetDevices(args) {

		let notify = args.opts[0];
		let host = args.host;
		let port = args.port;

		let got = [];

		let stored = gsettings.get_string('ups');

		// e.g.:
		//  got = [
		//	{
		//		name: 'name',
		//		host: 'host',
		//		port: 'port'
		//	},
		//	{
		//		name: 'name1',
		//		host: 'host1',
		//		port: 'port1',
		//		user: 'user1',
		//		pw: 'pw1'
		//	},
		//		...
		// ]
		got = JSON.parse(!stored || stored == '' ? '[]' : stored);

		// Unable to find an UPS -> returns already available ones
		if (args.error || !Object.keys(args.data).length) {

			// Notify
			if (notify)
				Main.notifyError(
					// TRANSLATORS: Notify title/description for error while searching new devices
					_("NUT: Error!"),
					_("Unable to find new devices at host %s:%s").format(host, port)
				);

			this._devices = got;

			// No stored UPSes
			if (!this._devices.length) {

				this._state |= ErrorType.NO_UPS;

				return;

			}

			// Check which stored UPS is available
			this._checkAll();

			this._state &= ~ErrorType.NO_UPS;

			return;

		}

		// Store here the actual length of the retrieved list
		let l = got.length;

		// Found devices
		let devices = args.data;

		// Number of devices found
		let foundDevices = 0;

		// Iterate through each device
		for (let device in devices) {

			let ups = {};

			ups.name = device;
			ups.host = host;
			ups.port = port;

			// Check if we already have this UPS
			let isNew = 1;

			// Don't do anything if there aren't stored UPSes in the list
			if (l > 0) {

				for (let j = 0; j < got.length; j++) {

					if (got[j].name != ups.name)
						continue;

					if (got[j].host != ups.host)
						continue;

					if (got[j].port != ups.port)
						continue;

					isNew = 0;

					break;

				}

			}

			// New UPS found!
			if (isNew) {

				got.push(ups);

				// Notify
				if (notify) {

					Main.notify(
						// TRANSLATORS: Notify title/description on every new device found
						_("NUT: new device found"),
						_("Found device %s at host %s:%s").format(ups.name, ups.host, ups.port)
					);

					foundDevices++;

				}

			}

		}

		// Notify
		if (notify) {

			// Devices found (more than 1)
			if (foundDevices > 1)
				Main.notify(
					// TRANSLATORS: Notify title/description on new devices found (more than one)
					_("NUT: new devices found"),
					_("Found %d devices at host %s:%s").format(foundDevices, host, port)
				);

			// No devices found
			else if (!foundDevices)
				Main.notifyError(
					// TRANSLATORS: Notify title/description for error while searching new devices
					_("NUT: Error!"),
					_("Unable to find new devices at host %s:%s").format(host, port)
				);

		}

		// First item of got array is the 'chosen' UPS: preserve it
		let chosen = got.shift();

		// Then sort UPSes in alphabetical order (host:port, and then name)
		got.sort(
			function(a, b) {
				return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (
					((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0
				);
			}
		);

		// And now restore chosen UPS
		got.unshift(chosen);

		// Store new devices in schema
		if (got.length > l)
			gsettings.set_string('ups', '%s'.format(JSON.stringify(got)));

		this._devices = got;

		// Check which stored UPS is available
		this._checkAll();

		this._state &= ~ErrorType.NO_UPS;

	}

	// Check which stored UPS is available
	_checkAll() {

		for (let i = 0; i < this._devices.length; i++) {

			let item = this._devices[i];

			// Just in case we lose the UPS..
			item.av = 0;

			let client = new Nut.NUTHelper({
				host: item.host,
				port: item.port
			});

			client.getVar({
				upsName: item.name,
				varName: 'ups.status',
				callback: Lang.bind(this, this._checkUps),
				opts: [ item ]
			});

		}

	}

	// Callback function to tell whether a given UPS is available or not
	// The currently processed UPS will get added to its properties its availability:
	// - if available -> av = 1:
	//   e.g. {
	//	name: 'name',
	//	host: 'host',
	//	port: 'port',
	//	av: 1
	//   }
	// - if not available -> av = 0:
	//   e.g. {
	//	name: 'name1',
	//	host: 'host1',
	//	port: 'port1',
	//	user: 'user1',
	//	pw: 'pw1',
	//	av: 0
	//   }
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	varName: name of the variable, i.e. 'ups.status',
	//	opts: optional data passed to the callback function, i.e. [ *device* ],
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = var's value (e.g. 'OL CHRG')
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_checkUps(args) {

		// The UPS we're checking
		let ups = args.opts[0];

		if (args.error || !args.data.length)
			ups.av = 0;
		else
			ups.av = 1;

		let updateNeeded = true;

		for (let i = 0; i < this._prevDevices.length; i++) {

			let prev = this._prevDevices[i];

			if (prev.name != ups.name)
				continue;

			if (prev.host != ups.host)
				continue;

			if (prev.port != ups.port)
				continue;

			if (prev.av != ups.av)
				continue;

			// Don't update the displayed list of devices if nothing changes
			updateNeeded = false;
			break;

		}

		if (updateNeeded && walnut) {

			// Refresh the list of devices
			walnut.refreshList();

		}

	}

	// Retrieve chosen UPS's variables
	_getVars() {

		// Reset status
		this._state |= ErrorType.UPS_NA;

		let client = new Nut.NUTHelper({
			host: this._devices[0].host,
			port: this._devices[0].port
		});

		client.listVars({
			upsName: this._devices[0].name,
			callback: Lang.bind(this, this._processVars)
		});

	}

	// Callback function for *this._getVars()* - update status and vars
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = {
	//	'var.1 name': 'var.1's value',
	//	'var.2 name': 'var.2's value',
	//		...
	// }
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_processVars(args) {

		let hasChanged = false;

		// The actually chosen device
		let act = this._devices[0] || { name: '' };

		// The device the currently processed function belongs to is no longer the chosen one
		if (act.name != args.upsName || act.host != args.host || act.port != args.port)
			return;

		if (args.error || !Object.keys(args.data).length) {

			this._state |= ErrorType.UPS_NA;

			act.av = 0;

		} else {

			this._vars = args.data;

			this._state &= ~ErrorType.UPS_NA;

			act.av = 1;

			// Update setvars/commands

			let prev = this._prevChosen || { name: '' };

			// Update only if something changed
			if (act.name != prev.name || act.host != prev.host || act.port != prev.port || act.av != prev.av) {

				if (upsrwDo)
					upsrwDo.update();

				if (upscmdDo)
					upscmdDo.update();

				hasChanged = true;

			}

		}

		if (this._forceRefresh) {

			Mainloop.source_remove(this._forceRefresh);

			delete this._forceRefresh;

		}

		// Update panel/menu
		if (walnut) {

			walnut.refreshPanel();

			if (walnut.menu.isOpen)
				walnut.refreshMenu({ forceRefresh: hasChanged });

		}

		// Save actually processed device
		this._prevChosen = JSON.parse(JSON.stringify(act));

	}

	// Update infos at a given interval
	_updateTimer() {

		this.update();

		this._timer = Mainloop.timeout_add_seconds(this._interval, Lang.bind(this, this._updateTimer));

		// Just in case we lose the UPS..
		this._forceRefresh = Mainloop.timeout_add_seconds(2, Lang.bind(this, function() {

			if (walnut) {

				walnut.refreshPanel();

				if (walnut.menu.isOpen)
					walnut.refreshMenu({ forceRefresh: true });

			}

			delete this._forceRefresh;

		}));

	}

	// Search for available devices and then for the first one's variables
	// args = {
	//	forceRefresh: whether to do a refresh also if INTERVAL time isn't elapsed
	// }
	update(args) {

		let forceRefresh = args ? args.forceRefresh : false;

		// milliseconds
		let now = Date.now();

		// Last time the list has been updated
		if (!this._lastTime)
			this._lastTime = now;

		// Update the list
		if (forceRefresh || ((now - this._lastTime) > INTERVAL)) {

			this.getDevices();

			this._lastTime = now;

		}

		if (this._state & ErrorType.NO_UPS)
			return;

		this._getVars();

	}

	// Return actual UpscMonitor status (ErrorType.{NO_UPS, ..})
	getState() {

		return this._state;

	}

	// Return actual device list and their availability
	getList() {

		return this._devices;

	}

	// Return actual chosen device's variables in an Object where keys are variables' names
	// (e.g.: {
	//	'battery.charge': '100',
	//	'ups.status': 'OL',
	//		...
	// })
	getVars() {

		return this._vars;

	}

	// Remove timer and disconnect signals
	destroy() {

		// Remove timers
		if (this._timer)
			Mainloop.source_remove(this._timer);

		if (this._forceRefresh)
			Mainloop.source_remove(this._forceRefresh);

		// Disconnect settings-changed connection
		gsettings.disconnect(this._settingsChangedId);

	}
};

// UpscmdDo: handle instant commands
const	UpscmdDo = class {

	constructor() {

		this._hasCmds = false;

		this._cmds = [];

	}

	update() {

		// Reset status
		this._hasCmds = false;

		// Get actual device
		this._device = upscMonitor.getList()[0];

		// Don't do anything in case of errors
		if (upscMonitor.getState() & (ErrorType.NO_UPS | ErrorType.UPS_NA))
			return;

		this._retrieveCmds();

	}

	// Get instant commands from the UPS
	_retrieveCmds() {

		let client = new Nut.NUTHelper({
			host: this._device.host,
			port: this._device.port
		});

		client.listCmds({
			upsName: this._device.name,
			callback: Lang.bind(this, this._processRetrievedCmds)
		});

	}

	// Callback function for _retrieveCmds()
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = {
	//	'command.1 name': 'command.1's description',
	//	'command.2 name': 'command.2's description',
	//	...
	// }
	// NOTE: if a command's description is not available, it'll be set as 'Unavailable'
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_processRetrievedCmds(args) {

		// The actually chosen device
		let act = upscMonitor.getList()[0] || { name: '' };

		// The device the currently processed function belongs to is no longer the chosen one
		if (act.name != args.upsName || act.host != args.host || act.port != args.port)
			return;

		if (args.error) {
			this._hasCmds = false;
			return;
		}

		// Store retrieved commands
		this._cmds = args.data;

		this._hasCmds = true;

	}

	hasCmds() {

		return this._hasCmds;

	}

	getCmds() {

		return this._cmds;

	}

	// Try to exec a NUT instant command
	// args = {
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	device: device which should get the command
	//	command: command name
	//	extradata: extradata to pass to the command
	// }
	cmdExec(args) {

		let user = args.username;
		let pw = args.password;
		let device = args.device;
		let cmd = args.command;
		let extradata = args.extradata;

		let extra = extradata.trim();

		// We have both user and password
		if (user && pw) {

			let client = new Nut.NUTHelper({
				host: device.host,
				port: device.port
			});

			client.instCmd({
				upsName: device.name,
				cmdName: cmd,
				cmdExtraData: extra,
				username: user,
				password: pw,
				callback: Lang.bind(this, this._processExecutedCmd),
				opts: [ device ]
			});

		// User, password or both are not available
		} else {

			// ..ask for them
			let credDialog = new CredDialogCmd({
				device: device,
				username: user,
				password: pw,
				command: cmd,
				extradata: extra
			});
			credDialog.open(global.get_current_time());

		}

	}

	// Callback function for *this.cmdExec()* - process the result of the executed instant command
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	username: username used for authentication,
	//	password: password used for authentication,
	//	cmdName: name of the command we tried to execute,
	//	cmdExtraData: value passed to the command,
	//	opts: optional data passed to the callback function, i.e. [ *device* ],
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = 'OK'
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_processExecutedCmd(args) {

		let device = args.opts[0];

		let cmdExtra;

		if (args.cmdExtraData && args.cmdExtraData.length)
			cmdExtra = '\'%s %s\''.format(args.cmdName, args.cmdExtraData);
		else
			cmdExtra = args.cmdName;

		// args.*error* = 'ERR ACCESS-DENIED' -> Authentication error -> Wrong username or password
		if (args.error && args.error.indexOf('ERR ACCESS-DENIED') != -1) {

			// ..ask for them and tell the user the previuosly sent ones were wrong
			let credDialog = new CredDialogCmd({
				device: device,
				username: args.username,
				password: args.password,
				command: args.cmdName,
				extradata: args.cmdExtraData,
				error: true
			});
			credDialog.open(global.get_current_time());

		// args.*data* = OK -> Command sent to the driver successfully
		} else if (args.data && args.data.indexOf('OK') != -1) {

			Main.notify(
				// TRANSLATORS: Notify title/description on command successfully sent
				_("NUT: command handled"),
				_("Successfully sent command %s to device %s@%s:%s").format(cmdExtra, device.name, device.host, device.port)
			);

			// Update vars/panel/menu (not devices)
			upscMonitor.update();

		// mmhh.. something's wrong here!
		} else {

			Main.notifyError(
				// TRANSLATORS: Notify title/description for error on command sent
				_("NUT: error while handling command"),
				_("Unable to send command %s to device %s@%s:%s").format(cmdExtra, device.name, device.host, device.port)
			);

		}

	}
};

// UpsrwDo: handle rw variables
const	UpsrwDo = class{

	constructor() {

		this._hasSetVars = false;

		this._setVar = {};

	}

	update() {

		// Reset status
		this._hasSetVars = false;

		// Get actual device
		this._device = upscMonitor.getList()[0];

		// Don't do anything in case of errors
		if (upscMonitor.getState() & (ErrorType.NO_UPS | ErrorType.UPS_NA))
			return;

		this._retrieveSetVars();

	}

	// _retrieveSetVars: get settable vars and their boundaries from the UPS
	_retrieveSetVars() {

		let client = new Nut.NUTHelper({
			host: this._device.host,
			port: this._device.port
		});

		client.listRWs({
			upsName: this._device.name,
			callback: Lang.bind(this, this._processRetrievedSetVars)
		});

	}

	// _processRetrievedSetVars: callback function for _retrieveSetVars()
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = {
	//	'var.1 name': {
	//		type: var.1's type,
	//		opts: var.1's options
	//	},
	//	'var.2 name': {
	//		type: var.2's type,
	//		opts: var.2's options
	//	},
	//		...
	// }
	// type (args.data['var.n name'].*type*) is one of: RANGE, ENUM, STRING, UNKNOWN (on errors)
	// options (args.data['var.n name'].*opts*) are:
	// - if type = RANGE -> an array of the available ranges:
	//	[
	//		{
	//			min: 'range #1's minimum acceptable value',
	//			max: 'range #1's maximum acceptable value'
	//		},
	//		{
	//			min: 'range #2's minimum acceptable value',
	//			max: 'range #2's maximum acceptable value'
	//		},
	//			...
	//	]
	// - if type = ENUM -> an array of the available enumerated values:
	//	[
	//		'enumerated value #1',
	//		'enumerated value #2',
	//		...
	//	]
	// - if type = STRING -> maximum length of the string
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_processRetrievedSetVars(args) {

		// The actual 'chosen' device
		let act = upscMonitor.getList()[0] || { name: '' };

		// The device the currently processed function belongs to is no longer the chosen one
		if (act.name != args.upsName || act.host != args.host || act.port != args.port)
			return;

		if (args.error || !Object.keys(args.data).length) {
			this._hasSetVars = false;
			return;
		}

		this._setVar = args.data;

		this._hasSetVars = true;

	}

	hasSetVars() {

		return this._hasSetVars;

	}

	getSetVars() {

		return this._setVar;

	}

	// setVar: try to set args.*varName* to args.*varValue* in args.*device*
	// args = {
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	device: device which should get the variable changed
	//	varName: variable's name
	//	varValue: variable's value
	// }
	setVar(args) {

		let device = args.device;
		let user = args.username;
		let pw = args.password;
		let varName = args.varName;
		let varValue = args.varValue;

		if (!user)
			user = device.user;

		if (!pw)
			pw = device.pw;

		// We have both user and password
		if (user && pw) {

			let client = new Nut.NUTHelper({
				host: device.host,
				port: device.port
			});

			client.setVar({
				upsName: device.name,
				username: user,
				password: pw,
				varName: varName,
				varValue: varValue,
				callback: Lang.bind(this, this._processSetVar),
				opts: [ device ]
			});

		// User, password or both are not available
		} else {

			// ..ask for them
			let credDialog = new CredDialogSetvar({
				device: device,
				username: user,
				password: pw,
				varName: varName,
				varValue: varValue
			});
			credDialog.open(global.get_current_time());

		}

	}

	// _processSetVar: callback function for *this.setVar()*
	// args = {
	//	host: hostname we tried to connect to,
	//	port: port used to connect,
	//	upsName: name of the UPS,
	//	username: username used for authentication,
	//	password: password used for authentication,
	//	varName: name of the variable,
	//	varValue: value we tried to set variable to,
	//	opts: optional data passed to the callback function, i.e. [ *device* ],
	//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
	//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both
	// }
	// args.*data* = 'OK'
	// args.*error* may be:
	// - one of NUT's net protocol errors
	// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
	// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
	// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
	// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
	// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
	// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
	// - 'ERR UNKNOWN' - unknown errors
	_processSetVar(args) {

		let device = args.opts[0];

		// args.*error* = 'ERR ACCESS-DENIED' -> Authentication error -> Wrong username or password
		if (args.error && args.error.indexOf('ERR ACCESS-DENIED') != -1) {

			// ..ask for them and tell the user the previuosly sent ones were wrong
			let credDialog = new CredDialogSetvar({
				device: device,
				username: args.username,
				password: args.password,
				varName: args.varName,
				varValue: args.varValue,
				error: true
			});
			credDialog.open(global.get_current_time());

		// args.*data* = 'OK' -> Setvar sent to the driver successfully
		} else if (args.data && args.data.indexOf('OK') != -1) {

			Main.notify(
				// TRANSLATORS: Notify title/description on setvar successfully sent
				_("NUT: setvar handled"),
				_("Successfully set %s to %s in device %s@%s:%s").format(args.varName, args.varValue, device.name, device.host, device.port)
			);

			// Update vars/panel/menu (not devices)
			upscMonitor.update();

		// mmhh.. something's wrong here!
		} else {

			Main.notifyError(
				// TRANSLATORS: Notify title/description for error on setvar sent
				_("NUT: error while handling setvar"),
				_("Unable to set %s to %s in device %s@%s:%s").format(args.varName, args.varValue, device.name, device.host, device.port)
			);

		}

	}
};

// walNUT: Panel button/menu
const	walNUT = GObject.registerClass(
class	walNUT extends PanelMenu.Button {

	_init() {

		super._init(0.0, 'walNUT');

		this._monitor = upscMonitor;
		this._state = this._monitor.getState();

		// Panel button
		let _btnBox = new St.BoxLayout();
		// Panel icon
		this._icon = new St.Icon({
			gicon: PanelIcons.E,
			style_class: 'system-status-icon'
		});
		// Panel label for battery charge and device load
		this._status = new St.Label({ y_align: Clutter.ActorAlign.CENTER });

		_btnBox.add(this._icon);
		_btnBox.add(this._status);

		this.add_actor(_btnBox);
		this.add_style_class_name('panel-status-button');

		// Menu
		let menu = new walNUTMenu({ sourceActor: this });
		this.setMenu(menu);

		// Bottom Buttons

		// Settings button
		this._pref_btn = new Button({
			gicon: MiscIcons.Preferences,
			// TRANSLATORS: Accessible name of 'Preferences' button
			accessibleName: _("Preferences"),
			callback: function() {

				Main.shellDBusService._extensionsService.LaunchExtensionPrefs(Me.metadata.uuid);

			}
		});

		// Credentials button
		this._cred_btn = new Button({
			gicon: MiscIcons.Credentials,
			// TRANSLATORS: Accessible name of 'Credentials' button
			accessibleName: _("Credentials"),
			callback: Lang.bind(this, function() {
				// If credBox is visible, close it, otherwise, open it
				this.menu.credBox.toggle();
			})
		});

		// Add UPS button
		this._add_btn = new Button({
			gicon: MiscIcons.FindDevices,
			// TRANSLATORS: Accessible name of 'Find new devices' button
			accessibleName: _("Find new devices"),
			callback: Lang.bind(this, function() {
				// If addBox is visible, close it, otherwise, open it
				this.menu.addBox.toggle();
			})
		});

		// Delete UPS from devices list button
		this._del_btn = new Button({
			gicon: MiscIcons.DeleteDevice,
			// TRANSLATORS: Accessible name of 'Delete device' button
			accessibleName: _("Delete device"),
			callback: Lang.bind(this, function() {
				// If delBox is visible, close it, otherwise, open it
				this.menu.delBox.toggle();
			})
		});

		// Help button
		this._help_btn = new Button({
			gicon: MiscIcons.Help,
			// TRANSLATORS: Accessible name of 'Help' button
			accessibleName: _("Help"),
			callback: function() {

				let yelp = Utilities.detect('yelp');
				let help = Me.dir.get_child('help');

				// Get locale
				let locale = Utilities.getLocale();

				// If yelp is available and the [localized] help is found, we'll use them..
				if (yelp && help.query_exists(null)) {

					// Language code + country code (eg. en_US, it_IT, ..)
					if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
						Util.spawn([
							'yelp',
							'%s/%s'.format(help.get_path(), locale.split('.')[0])
						]);

					// Language code (eg. en, it, ..)
					else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
						Util.spawn([
							'yelp',
							'%s/%s'.format(help.get_path(), locale.split('_')[0])
						]);

					else
						Util.spawn([
							'yelp',
							'%s/C'.format(help.get_path())
						]);

				// ..otherwise we'll open the html page
				} else {

					// If [localized] help is found, we'll use it
					if (help.query_exists(null)) {

						// Language code + country code (eg. en_US, it_IT, ..)
						if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
							Util.spawn([
								'xdg-open',
								'%s/%s/help.html'.format(help.get_path(), locale.split('.')[0])
							]);

						// Language code (eg. en, it, ..)
						else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
							Util.spawn([
								'xdg-open',
								'%s/%s/help.html'.format(help.get_path(), locale.split('_')[0])
							]);

						else
							Util.spawn([
								'xdg-open',
								'%s/C/help.html'.format(help.get_path())
							]);

					// ..otherwise we'll open the web page
					} else {

						Util.spawn([
							'xdg-open',
							'https://github.com/zykh/walNUT'
						]);

					}

				}

			}
		});

		// Always show Bottom Buttons (some won't be reactive in case of certain errors)

		// Preferences
		this.menu.controls.addControl({ button: this._pref_btn });

		// Credentials
		this.menu.controls.addControl({
			button: this._cred_btn,
			status: !(this._state & ErrorType.NO_UPS) ? 'active' : 'inactive'
		});

		// Find new UPSes
		this.menu.controls.addControl({ button: this._add_btn });

		// Delete UPS
		this.menu.controls.addControl({
			button: this._del_btn,
			status: !(this._state & ErrorType.NO_UPS) ? 'active' : 'inactive'
		});

		// Help
		this.menu.controls.addControl({ button: this._help_btn });

		// Update options stored in schema
		this._updateOptions();

		// Connect update on settings changed
		let settingsChangedId = gsettings.connect('changed', Lang.bind(this, this._updateOptions));

		// Disconnect settings-changed connection on destroy
		this.connect('destroy', Lang.bind(this, function() {
			gsettings.disconnect(settingsChangedId);
		}));

		// Init panel/menu
		this.refreshPanel();
		this.refreshMenu({ forceRefresh: true });

	}

	// Hide panel button
	hide() {

		this.actor.hide();

	}

	// Show panel button
	show() {

		this.actor.show();

	}

	// Update Options
	_updateOptions() {

		// Retrieve values stored in schema

		// Device model ('manufacturer - model')
		this._display_device_model = gsettings.get_boolean('display-device-model');

		// Info displayed in 'DataTable'
		for (let data in DataTableItems)
			this['_display_' + data] = gsettings.get_boolean(DataTableItems[data].gsetting);

		// Raw Data

		// Display raw data
		this._display_raw = gsettings.get_boolean('display-raw');

		// UPS commands

		// Display UPS commands
		this._display_cmd = gsettings.get_boolean('display-cmd');

		// Panel button options

		// Display device load in panel icon
		this._panel_icon_display_load = gsettings.get_boolean('panel-icon-display-load');

		// Display device load in panel label
		this._panel_text_display_load = gsettings.get_boolean('panel-text-display-load');

		// Display battery charge in panel label
		this._panel_text_display_charge = gsettings.get_boolean('panel-text-display-charge');

	}

	// Close the boxes and update the menu when it's opened
	_onOpenStateChanged(menu, open) {

		super._onOpenStateChanged(menu, open);

		// open -> update
		if (open) {

			this.refreshMenu({ forceRefresh: true });

			// How ugly is having different values in panel and in menu?
			this.refreshPanel();

			// Close {add,cred,del}Box

			this.menu.addBox.close();

			this.menu.delBox.close();

			this.menu.credBox.close();

		}

	}

	// Update panel icon and text
	refreshPanel() {

		this._state = this._monitor.getState();

		this._updatePanelIcon();
		this._updatePanelText();

	}

	// Update icon displayed in panel
	_updatePanelIcon() {

		// Errors!
		if (this._state & (ErrorType.NO_UPS | ErrorType.UPS_NA)) {
			// Set panel icon
			this._icon.gicon = PanelIcons.E;
			// ..and return
			return;
		}

		let vars = this._monitor.getVars();
		let icon, battery_level = 1, load_level = 1, charged = false;

		if (vars['battery.charge']) {

			battery_level = Utilities.parseBatteryLevel(vars['battery.charge']);

			charged = vars['battery.charge'] * 1 == 100;

		} else {

			// If the UPS isn't telling us it's charging or discharging -> we suppose it's charged
			charged = vars['ups.status'].indexOf('CHRG') != -1 ? charged : true;

		}

		if (vars['ups.load'] && this._panel_icon_display_load)
			load_level = Utilities.parseLoadLevel(vars['ups.load']);

		let status = Utilities.parseStatus(vars['ups.status'], true);

		icon = status.line + (status.alarm || '') + ((status.line == 'O') && charged ? 'C' : '') + battery_level * load_level;

		this._icon.gicon = PanelIcons[icon];

	}

	// Update infos displayed in panel
	_updatePanelText() {

		// Errors!
		if (this._state & (ErrorType.NO_UPS | ErrorType.UPS_NA)) {
			// Set panel text
			this._status.text = '';
			// ..and return
			return;
		}

		let vars = this._monitor.getVars();
		let text = '';

		// Display battery charge
		if (this._panel_text_display_charge && vars['battery.charge'])
			// TRANSLATORS: Panel text for battery charge
			text += _("C: %d%").format(vars['battery.charge'] * 1);

		// Display UPS load
		if (this._panel_text_display_load && vars['ups.load']) {

			// If battery charge is displayed, add comma + white space
			if (text)
				// TRANSLATORS: Panel text between battery charge and device load
				text += _(", ");

			// TRANSLATORS: Panel text for device load
			text += _("L: %d%").format(vars['ups.load'] * 1);

		}

		if (text)
			text = ' ' + text;

		this._status.text = text;

	}

	// Update menu
	// args = {
	//	forceRefresh: whether the menu has to be forcedly refreshed, e.g. if the chosen device has changed
	// }
	refreshMenu(args) {

		let forceRefresh = args ? args.forceRefresh : false;

		this._state = this._monitor.getState();

		// The devices list will be shown if at least one UPS is in the list, also if it's not currently available
		if (!(this._state & ErrorType.NO_UPS)) {

			if (forceRefresh)
				this.refreshList();

			if (!this.menu.upsList.actor.visible)
				this.menu.upsList.show();

		// ..else, hide it
		} else {

			if (this.menu.upsList.actor.visible)
				this.menu.upsList.hide();

		}

		// If at least one UPS is available -> show menu..
		if (!(this._state & (ErrorType.NO_UPS | ErrorType.UPS_NA))) {

			let vars = this._monitor.getVars();
			let devices = this._monitor.getList();

			// Hide error box, if visible
			if (this.menu.errorBox.actor.visible)
				this.menu.errorBox.hide();

			// UPS model
			if (this._display_device_model && (vars['device.mfr'] || vars['device.model']))
				this.menu.upsModel.show({
					manufacturer: vars['device.mfr'],
					model: vars['device.model']
				});

			else if (this.menu.upsModel.actor.visible)
				this.menu.upsModel.hide();

			// TopDataList

			// UPS status
			this.menu.upsTopDataList.update({
				type: 'S',
				value: vars['ups.status']
			});
			this.menu.upsTopDataList.show();

			// UPS alarm
			if (vars['ups.alarm'])
				this.menu.upsTopDataList.update({
					type: 'A',
					value: vars['ups.alarm']
				});
			else
				this.menu.upsTopDataList.hide({ type: 'A' });

			// UpsDataTable
			for (let data in DataTableItems) {
				if (this['_display_' + data] && vars[data])
					this.menu.upsDataTableAlt.show({
						type: data,
						value: vars[data]
					});
				else
					this.menu.upsDataTableAlt.hide({ type: data });
			}

			// Separator
			if (this._display_raw || this._display_cmd) {

				if (!this.menu.separator.actor.visible)
					this.menu.separator.actor.show();

			} else if (this.menu.separator.actor.visible) {

					this.menu.separator.actor.hide();

			}

			// UPS Raw Data
			if (this._display_raw)
				this.menu.upsRaw.update({
					vars: vars,
					forceRefresh: forceRefresh
				});

			else if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();

			// UPS Commands..
			if (this._display_cmd)
				this.menu.upsCmdList.show();

			else if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			// UPS Credentials Box
			if (forceRefresh)
				this.menu.credBox.update({ device: devices[0] });

		// ..else show error 'No UPS found'
		} else {

			// Hide not available infos

			if (this.menu.upsModel.actor.visible)
				this.menu.upsModel.hide();

			if (this.menu.upsTopDataList.actor.visible)
				this.menu.upsTopDataList.hide();

			if (this.menu.upsDataTableAlt.actor.visible)
				this.menu.upsDataTableAlt.hide();

			if (this.menu.separator.actor.visible)
				this.menu.separator.actor.hide();

			if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();

			if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			// Show errorBox
			this.menu.errorBox.show(this._state);

		}

		// Update Bottom Buttons (some won't be reactive in case of certain errors)

		// Credentials
		this.menu.controls.setControl({
			button: this._cred_btn,
			status: !(this._state & ErrorType.NO_UPS) ? 'active' : 'inactive'
		});

		// Delete UPS
		this.menu.controls.setControl({
			button: this._del_btn,
			status: !(this._state & ErrorType.NO_UPS) ? 'active' : 'inactive'
		});

	}

	refreshList() {

		let devices = this._monitor.getList();

		this.menu.upsList.update({ devices: devices });

	}
});

// CredDialog: prompt user for valid credentials (username and password)
const	CredDialog = GObject.registerClass(
class	CredDialog extends ModalDialog.ModalDialog {

	// args = {
	//	device: device for which authenticate
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	error: whether to show error 'Wrong username/password' or not
	// }
	_init(args) {

		super._init({ styleClass: 'prompt-dialog' });

		this._device = args.device;
		let user = args.username;
		let pw = args.password;
		let error = args.error;

		// Main container
		let container = new St.BoxLayout({
			style_class: 'prompt-dialog-main-layout message-dialog-main-layout',
			vertical: false/**/,
			x_expand: true,
			y_expand: true/**/
		});
		this.contentLayout.add(container);

		// Icon
		let icon = new St.Icon({
			gicon: MiscIcons.Credentials,
			style_class: 'message-dialog-icon',
			x_expand: true,
			y_expand: false,
			x_align: St.Align.END,
			y_align: St.Align.START
		});
		container.add(icon);

		// Container for messages and username and password entries
		let textBox = new St.BoxLayout({
			style_class: 'prompt-dialog-message-layout message-dialog-content',
			vertical: true,
			y_align: St.Align.START
		});
		container.add(textBox);

		// Label
		let label = new St.Label({
			// TRANSLATORS: Label of credentials dialog
			text: _("UPS Credentials"),
			style_class: 'prompt-dialog-headline message-dialog-title headline',
			y_expand: false,
			y_align: St.Align.START
		});
		textBox.add(label);

		// Description
		this.desc = new St.Label({
			text: '',
			style_class: 'prompt-dialog-description message-dialog-body'/**/,
			x_expand: true,
			y_expand: true/**/,
			y_align: St.Align.START
		});
		this.desc.clutter_text.line_wrap = true;
		this.desc.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
		this.desc.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
		textBox.add(this.desc);

		// Username/password table
		let table = new St.BoxLayout({ style_class: 'walnut-cred-dialog-table' });
		textBox.add(table);

		// Username label
		let userLabel = new St.Label({
			// TRANSLATORS: Username @ credentials dialog
			text: _("Username:"),
			x_align: Clutter.ActorAlign.START,
			y_align: Clutter.ActorAlign.CENTER,
			y_expand: true
		});

		// Username entry
		this.user = new St.Entry({
			text: user || '',
			can_focus: true,
			reactive: true
		});

		// Username right-click menu
		ShellEntry.addContextMenu(this.user);

		// user_valid tells us whether a username is set or not
		this.user_valid = user ? true : false;

		// Update Execute button when text changes in user entry
		this.user.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.user_valid = this.user.get_text().length > 0;
			this._updateOkButton({ error: false });
			// Hide errorBox, if visible
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Password label
		let pwLabel = new St.Label({
			// TRANSLATORS: Password @ credentials dialog
			text: _("Password:"),
			x_align: Clutter.ActorAlign.START,
			y_align: Clutter.ActorAlign.CENTER,
			y_expand: true
		});

		// Password entry
		this.pw = new St.PasswordEntry({
			text: pw || '',
			can_focus: true,
			reactive: true
		});

		// Password right-click menu
		ShellEntry.addContextMenu(this.pw);

		// Password visual appearance (hidden)
		this.pw.clutter_text.set_password_char('\u25cf');

		// pw_valid tells us whether a password is set or not
		this.pw_valid = pw ? true : false;

		// Update Execute button when text changes in pw entry
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.pw_valid = this.pw.get_text().length > 0;
			this._updateOkButton({ error: false });
			// Hide errorBox, if visible
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Put user/password together
		let labelColumn = new St.BoxLayout({
			style_class: 'walnut-cred-dialog-table-column',
			vertical: true
		});
		labelColumn.add(userLabel);
		labelColumn.add(pwLabel);
		let entryColumn = new St.BoxLayout({
			style_class: 'walnut-cred-dialog-table-column',
			vertical: true,
            x_expand: true,
            y_expand: true
		});
		entryColumn.add(this.user);
		entryColumn.add(this.pw);
		table.add(labelColumn);
		table.add(entryColumn);

		// Error box
		let errorBox = new St.BoxLayout({
			style_class: 'walnut-cred-dialog-error-box',
            x_expand: true,
            y_expand: true
		});
		textBox.add(errorBox);

		// Hide error box if no error has been reported
		if (error)
			errorBox.show();
		else
			errorBox.hide();

		// Error Icon
		let errorIcon = new St.Icon({
			gicon: MiscIcons.Error,
			style_class: 'walnut-cred-dialog-error-icon',
			y_align: St.Align.MIDDLE
		});
		errorBox.add(errorIcon);

		// Error message
		let errorText = new St.Label({
			// TRANSLATORS: Error message @ credentials dialog
			text: _("Wrong username or password"),
			style_class: 'walnut-cred-dialog-error-label',
			x_expand: true,
			y_align: St.Align.MIDDLE,
			y_expand: false
		});
		errorText.clutter_text.line_wrap = true;
		errorBox.add(errorText);

		this.ok = {
			// TRANSLATORS: Execute button @ credentials dialog
			label: _("Execute"),
			action: Lang.bind(this, this._onOk),
			default: true
		};

		this.setButtons([
			{
				// TRANSLATORS: Cancel button @ credentials dialog
				label: _("Cancel"),
				action: Lang.bind(this, this._onCancel),
				key: Clutter.KEY_Escape
			},
			this.ok
		]);

		this._updateOkButton({ error: error });

		// Set initial key-focus to the user entry
		this.setInitialKeyFocus(this.user);

	}

	// Update the Execute button so that it's reactive only if both username and password are set (length > 0) and if args.*error* isn't true
	// args = {
	//	error: whether username/password proved to be wrong
	// }
	_updateOkButton(args) {

		let error = args.error;
		let valid = false;

		valid = this.user_valid && this.pw_valid;

		this.ok.button.reactive = valid && !error;
		this.ok.button.can_focus = valid && !error;

	}

	// Actions to do when Execute button is pressed
	_onOk() {

		this.close(global.get_current_time());

	}

	// Actions to do when Cancel button is pressed
	_onCancel() {

		this.close(global.get_current_time());

	}
});

// CredDialogCmd: credential dialog for instant commands
const	CredDialogCmd = GObject.registerClass(
class	CredDialogCmd extends CredDialog {

	// args = {
	//	device: device which should get args.*command*
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	command: NUT command to send to args.*device*
	//	extradata: extradata to pass to args.*command*
	//	error: whether username/password proved to be wrong
	// }
	_init(args) {

		super._init({
			device: args.device,
			username: args.username,
			password: args.password,
			error: args.error
		});

		this._cmd = args.command;

		this._extra = args.extradata;

		// Description
		let cmdExtraDesc;

		if (this._extra.length)
			cmdExtraDesc = '\'%s %s\''.format(this._cmd, this._extra);
		else
			cmdExtraDesc = this._cmd;

		// TRANSLATORS: Description @ credentials dialog for instant commands
		this.desc.text = _("To execute the command %s on device %s@%s:%s, please insert a valid username and password").format(cmdExtraDesc, this._device.name, this._device.host, this._device.port);

	}

	_onOk() {

		upscmdDo.cmdExec({
			username: this.user.get_text(),
			password: this.pw.get_text(),
			device: this._device,
			command: this._cmd,
			extradata: this._extra
		});

		super._onOk();

	}
});

// CredDialogSetvar: credential dialog for setvars
const	CredDialogSetvar = class extends CredDialog {

	// args = {
	//	device: device in which set args.*varName*
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	varName: name of the variable to set
	//	varValue: value to set args.*varName* to
	//	error: whether username/password proved to be wrong
	// }
	constructor(args) {

		super({
			device: args.device,
			username: args.username,
			password: args.password,
			error: args.error
		});

		this._varName = args.varName;

		this._varValue = args.varValue;

		// TRANSLATORS: Description @ credentials dialog for setvars
		this.desc.text = _("To set the variable %s to %s on device %s@%s:%s, please insert a valid username and password").format(this._varName, this._varValue, this._device.name, this._device.host, this._device.port);

	}

	_onOk() {

		upsrwDo.setVar({
			username: this.user.get_text(),
			password: this.pw.get_text(),
			device: this._device,
			varName: this._varName,
			varValue: this._varValue
		});

		super._onOk();

	}
};

// YesNoSubMenu: a submenu used to show data which require an interaction with the user (yes/no)
const	YesNoSubMenu = class extends PopupMenu.PopupMenuSection {

	// args = {
	//	title: title of the submenu
	//	gicon: GIcon of the icon to be placed next to the *title*
	// }
	constructor(args) {

		super();
		this.actor.clip_to_allocation = true;
		this.actor.add_style_class_name('popup-sub-menu');

		// Title row (icon/label)
		let titleRow = new PopupMenu.PopupBaseMenuItem({
			activate: false,
			hover: false,
			can_focus: false
		});
		let titleIcon = new St.Icon({
			gicon: args.gicon,
			style_class: 'popup-menu-icon'
		});
		titleRow.actor.add(titleIcon);
		let titleLabel = new St.Label({
			text: args.title,
			style_class: 'walnut-yesnosubmenu-title',
            //x_expand: true,
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		titleRow.actor.add(titleLabel);
		titleRow.actor.label_actor = titleLabel;
		titleRow.actor.add_style_pseudo_class('checked');
		this.addMenuItem(titleRow);

		// Data row
		let dataRow = new PopupMenu.PopupBaseMenuItem({
			activate: false,
			hover: false,
			can_focus: false
		});
		this.addMenuItem(dataRow);

		// Container of box-specific data
		this.container = new St.BoxLayout({
			vertical: false,
			//y_expand: true,
			x_expand: true
		});
		dataRow.actor.add(this.container);

		// Cancel/Confirm buttons
		this.del = new Button({
			gicon: MiscIcons.Cancel,
			// TRANSLATORS: Accessible name of 'Cancel' button @ Yes/No submenus
			accessibleName: _("Cancel"),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});
		this.go = new Button({
			gicon: MiscIcons.OK,
			// TRANSLATORS: Accessible name of 'Confirm' button @ Yes/No submenus
			accessibleName: _("Confirm"),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});

		// Buttons container
		let buttons = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-yesnosubmenu-buttons-box'
		});
		buttons.add(this.del.actor);
		buttons.add(this.go.actor);
		dataRow.actor.add(buttons);

		this.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

		this.isOpen = false;
		this.actor.hide();

	}

	_subMenuOpenStateChanged(menu, open) {

		if (open) {
			this.actor.add_style_pseudo_class('open');
			this._getTopMenu()._setOpenedSubMenu(this);
			this.actor.add_accessible_state(Atk.StateType.EXPANDED);
		} else {
			this.actor.remove_style_pseudo_class('open');
			this._getTopMenu()._setOpenedSubMenu(null);
			this.actor.remove_accessible_state(Atk.StateType.EXPANDED);
		}

	}

	show() {

		this.actor.show();

	}

	hide() {

		this.actor.hide();

	}

	open() {

		if (this.isOpen)
			return;
		if (this.isEmpty())
			return;
		this.isOpen = true;
		if (this.actor.visible)
			return;
		this.emit('open-state-changed', true);
		this.actor.show();
		let [ minHeight, naturalHeight ] = this.actor.get_preferred_height(-1);
		this.actor.height = 0;
		Tweener.addTween(this.actor, {
			height: naturalHeight,
			time: 0.25,
			onCompleteScope: this,
			onComplete: function() {
				this.actor.set_height(-1);
			}
		});

	}

	close() {

		if (!this.isOpen)
			return;
		this.isOpen = false;
		if (!this.actor.visible)
			return;
		this.emit('open-state-changed', false);
		if (this._activeMenuItem)
			this._activeMenuItem.setActive(false);
		Tweener.addTween(this.actor, {
			height: 0,
			time: 0.25,
			onCompleteScope: this,
			onComplete: function() {
				this.actor.hide();
				this.actor.set_height(-1);
			}
		});

	}
};

// DelBox: a box used to delete UPSes from devices list
const	DelBox = class extends YesNoSubMenu {

	constructor() {

		super({
			// TRANSLATORS: Title of delete device box
			title: _("Delete UPS"),
			gicon: MiscIcons.DeleteDevice
		});

		// Text
		let text = new St.Label({
			// TRANSLATORS: Description @ delete device box
			text: Utilities.parseText(_("Do you really want to delete the current UPS from the list?"), 30),
            x_expand: true,
            y_expand: true
		});
		this.container.add(text);

		// Set callback functions for cancel/confirm buttons
		this.del.setCallback(Lang.bind(this, function() {
			this.close();
			// Give back focus to our 'submenu-toggle button'
			walnut._del_btn.actor.grab_key_focus();
		}));
		this.go.setCallback(Lang.bind(this, function() {
			Utilities.deleteUPS();
			this.close();
			// Give back focus to our 'submenu-toggle button'
			walnut._del_btn.actor.grab_key_focus();
			// Make the menu close itself to force an update
			this.itemActivated();
		}));

	}
};

// CredBox: a box used to set UPS credentials (user/password)
const	CredBox = class extends YesNoSubMenu {

	constructor() {

		super({
			// TRANSLATORS: Title of credentials box
			title: _("UPS Credentials"),
			gicon: MiscIcons.Credentials
		});

		// Username
		this.user = new St.Entry({
			text: '',
			// TRANSLATORS: Username hint @ credentials box
			hint_text: _("username"),
			can_focus: true,
			style_class: 'walnut-credbox-username',
            x_expand: true,
            y_expand: true
		});
		this.container.add(this.user);

		// Password
		this.pw = new St.Entry({
			text: '',
			// TRANSLATORS: Password hint @ credentials box
			hint_text: _("password"),
			can_focus: true,
			style_class: 'walnut-credbox-password',
            x_expand: true,
            y_expand: true
		});
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, this._updatePwAppearance));
		this.container.add(this.pw);

		// Set callback functions for cancel/confirm buttons
		this.del.setCallback(Lang.bind(this, function() {
			this._undoAndClose();
			// Give back focus to our 'submenu-toggle button'
			walnut._cred_btn.actor.grab_key_focus();
		}));
		this.go.setCallback(Lang.bind(this, function() {
			this._credUpdateAndClose();
			// Give back focus to our 'submenu-toggle button'
			walnut._cred_btn.actor.grab_key_focus();
		}));

	}

	// Update credentials and close CredBox: if empty user or password is given it'll be removed from the UPS's properties
	_credUpdateAndClose() {

		let user = this.user.get_text();
		let pw = this.pw.get_text();

		Utilities.setUPSCredentials({
			username: user,
			password: pw
		});

		this.close();

	}

	// Update password visual appearance (hidden or not)
	_updatePwAppearance() {

		if (this.pw.get_text().length > 0 && this._hide_pw)
			this.pw.clutter_text.set_password_char('\u25cf');
		else
			this.pw.clutter_text.set_password_char('');

	}

	// Undo changes and close CredBox
	_undoAndClose() {

		let device = upscMonitor.getList()[0];
		this.update({ device: device });

		this.close();

	}

	// Update username and password
	// args = {
	//	device: device whose user/password should be taken into account
	// }
	update(args) {

		let device = args.device;

		this.user.text = device.user || '';
		this.pw.text = device.pw || '';

		// Hide password chars?
		this._hide_pw = gsettings.get_boolean('hide-pw');

		this._updatePwAppearance();

	}
};

// AddBox: box used to find new UPSes
const	AddBox = class extends YesNoSubMenu {

	constructor() {

		super({
			// TRANSLATORS: Title of find new devices box
			title: _("Find new UPSes"),
			gicon: MiscIcons.FindDevices
		});

		// Hostname
		this.hostname = new St.Entry({
			// TRANSLATORS: Hostname hint @ find new devices box
			hint_text: _("hostname"),
			can_focus: true,
			style_class: 'walnut-addbox-host',
            x_expand: true,
            y_expand: true
		});
		this.container.add(this.hostname);

		// Port
		this.port = new St.Entry({
			// TRANSLATORS: Port hint @ find new devices box
			hint_text: _("port"),
			can_focus: true,
			style_class: 'walnut-addbox-port',
            x_expand: true,
            y_expand: true
		});
		this.container.add(this.port);

		// Set callback functions for cancel/confirm buttons
		this.del.setCallback(Lang.bind(this, function() {
			this._undoAndClose();
			// Give back focus to our 'submenu-toggle button'
			walnut._add_btn.actor.grab_key_focus();
		}));
		this.go.setCallback(Lang.bind(this, function() {
			this._addUps();
			// Give back focus to our 'submenu-toggle button'
			walnut._add_btn.actor.grab_key_focus();
		}));

	}

	// Search new UPSes at a given host:port, if not given it'll search at localhost:3493
	_addUps() {

		let host = this.hostname.get_text();
		let port = this.port.get_text();

		// Try to find the device
		upscMonitor.getDevices({
			notify: true,
			hostname: host || 'localhost',
			port: port || '3493'
		});

		// Clear and close AddBox
		this._undoAndClose();

	}

	// Undo changes and hide AddBox
	_undoAndClose() {

		this.hostname.text = '';
		this.port.text = '';

		this.close();

	}
};

// Button: Buttons with callback
const	Button = class {

	// args = {
	//	gicon: GIcon of the icon to use
	//	accessibleName: accessible name of the button
	//	callback: function to call when the button gets clicked
	//	size: size of the button {small,big}
	// }
	constructor(args) {

		let size = args.size;

		if (!size || size != 'small')
			size = 'big';

		// Icon
		let button_icon = new St.Icon({ gicon: args.gicon });

		// Button
		this.actor = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: args.accessibleName,
			style_class: 'system-menu-action walnut-buttons-%s'.format(size),
			child: button_icon
		});

		// Set callback, if any
		if (args.callback)
			this.actor.connect('clicked', args.callback);

	}

	// Set the callback function
	setCallback(cb) {

		this.actor.connect('clicked', cb);

	}
};

// BottomControls: container of bottom buttons
const	BottomControls = GObject.registerClass(
class	BottomControls extends PopupMenu.PopupBaseMenuItem {

	_init() {

		super._init({
			reactive: false,
			can_focus: false
		});

	}

	// Add a button to buttons box
	// args = {
	//	button: button to add to the buttons box
	//	status: status of the button {active,inactive}
	// }
	addControl(args) {

		args.button.actor.x_expand = false;
		args.button.actor.y_expand = false;

		this.actor.add(args.button.actor);

		this.setControl(args);

	}

	// Set the buttons' reactivity
	// args = {
	//	button: button whose status is to set
	//	status: status of the button {active,inactive}
	// }
	setControl(args) {

		let active = true;

		if (args.status && args.status == 'inactive')
			active = false;

		if (active)
			args.button.actor.reactive = true;
		else
			args.button.actor.reactive = false;

	}
});

// CmdPopupSubMenu: a PopupSubMenu for UpsCmdList: we need this so that we can update the submenu (= populate the PopupSubMenu) only and every time the menu is opened
const	CmdPopupSubMenu = class extends PopupMenu.PopupSubMenu {

	// args = {
	//	parent: this submenu's parent
	//	sourceActor: args.*parent*'s actor
	//	sourceArrow: args.*parent*'s spinning triangle
	// }
	constructor(args) {

		super(args.sourceActor, args.sourceArrow);

		this._delegate = args.parent;

	}

	open(animate) {

		if (this.isOpen)
			return;

		// Clean submenu..
		this._delegate.clean();

		// ..and then update it
		if (this.isEmpty()) {

			this._delegate.update();

			if (this.isEmpty())
				return;

		}

		super.open(animate);

	}
};

// UpsCmdList: a submenu listing UPS commands
const	UpsCmdList = GObject.registerClass(
class	UpsCmdList extends PopupMenu.PopupSubMenuMenuItem {

	_init() {

		// TRANSLATORS: Label of UPS commands sub menu
		super._init(_("UPS Commands"));

		// Command's extradata

		// Remove focus from St.BoxLayout..
		this.actor.can_focus = false;

		// ..and add it to our child St.BoxLayout
		let labelBox = new St.BoxLayout({
			can_focus: true,
			x_expand: true
		});

		// Add the label to our St.BoxLayout and put it in its place
		this.actor.insert_child_below(labelBox, this.label);
		this.actor.remove_child(this.label);
		labelBox.add(this.label);

		// Connect key focus
		labelBox.connect('key-focus-in', Lang.bind(this, this.vfunc_key_focus_in));
		labelBox.connect('key-focus-out', Lang.bind(this, this.vfunc_key_focus_out));

		// Remove the expander
		let expander = labelBox.get_next_sibling();
		this.actor.remove_child(expander);
		expander.destroy();

		// If *status* label (used here to show 'extradata') is not available (it has been dropped in GNOME Shell 3.18), create it and put it before the triangle
		if (!this.status) {
			this.status = new St.Label({
				style_class: 'popup-status-menu-item',
				y_align: Clutter.ActorAlign.CENTER,
				y_expand: true
			});
			this.actor.insert_child_below(this.status, this._triangleBin);
		}
		// TRANSLATORS: Extradata's label @ Device commands submenu
		this.status.text = _("extradata:");
		this.status.add_style_class_name('walnut-cmd-extradata-label');

		// Extradata's entry: we need to start with a nonempty entry otherwise, when clicking-in, the submenu will close itself
		this.extradata = new St.Entry({
			text: ' ',
			reactive: true,
			can_focus: true,
			style_class: 'walnut-cmd-extradata'
		});

		// For the same reason, if the user leave the entry empty, fill it with a space
		this.extradata.clutter_text.connect('text-changed', Lang.bind(this, function() {
			if (!this.extradata.get_text().length)
				this.extradata.text = ' ';
		}));

		// Add extradata's entry just before the triangle
		this.actor.insert_child_below(this.extradata, this._triangleBin);

		// Hide extradata's {entry,label}
		this.status.hide();
		this.extradata.hide();

		// Override base PopupSubMenu with our sub menu that update itself only and every time it is opened
		this.menu = new CmdPopupSubMenu({
			parent: this,
			sourceActor: this.actor,
			sourceArrow: this._triangle
		});

		// Connect our extradata-toggle
		this.menu.connect('open-state-changed', Lang.bind(this, this._extradataToggle));

		// Reconnect SubMenuMenuItem standard function
		this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

	}

	// Toggle extradata's view
	_extradataToggle(menu, open) {

		if (open) {

			this.status.show();
			this.extradata.show();

		} else {

			this.status.hide();

			// Clear extradata
			this.extradata.text = ' ';

			this.extradata.hide();

		}

	}

	// Build submenu
	_buildInfo() {

		// Error!
		if (!upscmdDo.hasCmds()) {

			this.menu.addMenuItem(
				new PopupMenu.PopupMenuItem(
					// TRANSLATORS: Error @ UPS commands submenu
					Utilities.parseText(_("Error while retrieving UPS commands"), Lengths.CMD),
					{
						reactive: true,
						activate: false,
						hover: false,
						can_focus: false
					}
				)
			);

			return;

		}

		// Retrieve instant commands
		let commands = upscmdDo.getCmds();

		// Make sure commands are alphabetically ordered
		let orderedCommands = [];

		for (let command in commands)
			orderedCommands.push(command);

		orderedCommands.sort();

		// List available commands, if any
		if (orderedCommands.length > 0) {

			// List UPS commands in submenu
			for (let i = 0; i < orderedCommands.length; i++) {

				let command = orderedCommands[i];

				let item = {
					cmd: command,
					desc: commands[command]
				}

				let cmd = new PopupMenu.PopupMenuItem(gsettings.get_boolean('display-cmd-desc') ? '%s\n%s'.format(command, Utilities.parseText(Utilities.cmdI18n(item).desc, Lengths.CMD)) : command);

				cmd.connect('activate', Lang.bind(this, function() {
					upscmdDo.cmdExec({
						username: this._device.user,
						password: this._device.pw,
						device: this._device,
						command: command,
						extradata: this.extradata.get_text().trim()
					});
				}));

				this.menu.addMenuItem(cmd);

				// Scroll the parent menu when item gets key-focus
				cmd.actor.connect('key-focus-in', Lang.bind(this, function(self) {
					if (self.get_hover())
						return;
					Util.ensureActorVisibleInScrollView(this.menu.actor, self);
				}));

			}

			return;

		}

		// No UPS command available

		this.menu.addMenuItem(
			new PopupMenu.PopupMenuItem(
				// TRANSLATORS: Error @ UPS commands submenu
				Utilities.parseText(_("No UPS command available"), Lengths.CMD),
				{
					reactive: true,
					activate: false,
					hover: false,
					can_focus: false
				}
			)
		);

	}

	// Remove submenu's children, if any
	clean() {

		if (!this.menu.isEmpty())
			this.menu.removeAll();

	}

	// Update submenu
	update() {

		this._device = upscMonitor.getList()[0];

		this.clean();

		this._buildInfo();

		this.show();

	}

	hide() {

		// If the submenu is not empty, destroy all children
		this.clean();

		//this.actor.hide();

	}

	show() {

		//this.actor.show();

	}
});

// SetvarBox: box used to handle setvars
const	SetvarBox = class extends PopupMenu.PopupMenuSection {

	// args = {
	//	varName: name of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	constructor(args) {

		super();

		// Variable's name
		this._varName = args.varName;

		// Our toggle-button
		this._scrollView = args.scrollView;

	}

	// Open SetvarBox and if actual value is not equal to the previous value, update the SetvarBox
	// args = {
	//	actualValue: actual value of the settable variable
	// }
	show(args) {

		if (this._actualValue == undefined || args.actualValue != this._actualValue)
			this._resetTo(args.actualValue);

		this.actor.show();

	}

	// Hide SetvarBox
	hide() {

		this.actor.hide();

	}

	isClosed() {

		return !this.actor.visible;

	}

	// Reset setvar box to *value*
	_resetTo(value) {

		this._actualValue = value;

	}
};

// SetvarRangeItem: one of the available ranges displayed in SetvarBoxRanges
const	SetvarRangeItem = class extends PopupMenu.PopupMenuItem {

	// args = {
	//	range: {
	//		min: lower limit of the range
	//		max: upper limit of the range
	//	},
	//	callback: function to call, passing to it *range*, when activated; if not set, the item is treated (and represented) as the actual range
	// }
	constructor(args) {

		// TRANSLATORS: Range interval @ Setvar box
		let rangeLabel = _("%s - %s").format(args.range.min, args.range.max);

		if (args.callback != null) {
			super(rangeLabel);
		} else {
			super(rangeLabel, { activate: false });
			// Set the item as checked if it represents actual range
			this.setOrnament(PopupMenu.Ornament.DOT);
		}

		this._range = args.range;
		this._callback = args.callback;

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this.actor.insert_child_below(spacer, this._ornamentLabel)

	}

	activate(event) {

		if (this._callback != null)
			this._callback(this._range);

		this._parent.focusSlider();

	}
};

// SetvarBoxRanges: box to set r/w variables with ranges
const	SetvarBoxRanges = class extends SetvarBox {

	// args = {
	//	varName: name of the settable variable
	//	rages: available ranges of the settable variable
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	constructor(args) {

		super({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// _ranges: [
		//	{
		//		min: value,
		//		max: value
		//	},
		//	{
		//		min: value,
		//		max: value
		//	},
		//		...
		// ]
		this._ranges = args.ranges;

		// _rangeAct: {
		//	min: value,
		//	max: value
		// }
		this._rangeAct = {};

		// Slider
		this._slider = new Slider.Slider(0.5);
		let sliderItem = new PopupMenu.PopupBaseMenuItem({
			activate: false,
            x_expand: true,
            y_expand: true
		});
		sliderItem.actor.add(this._slider.actor);
		sliderItem.actor.connect('button-press-event', Lang.bind(this, function(actor, event) {
			return this._slider.startDragging(event);
		}));
		sliderItem.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {
			return this._slider.onKeyPressEvent(actor, event);
		}));
		this.addMenuItem(sliderItem);

		// Flip slider for RTL locales
		if (this._slider.actor.get_text_direction() == Clutter.TextDirection.RTL)
			this._slider.actor.set_scale_with_gravity(-1.0, 1.0, Clutter.Gravity.NORTH);

		// Labels box
		let rangeValueBox = new St.BoxLayout({
			style_class: 'popup-menu-item',
            x_expand: true,
            y_expand: true
		});
		this.actor.add(rangeValueBox);

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		rangeValueBox.add(spacer);

		// Labels
		this._rangeMinLabel = new St.Label({ text: '' });
		rangeValueBox.add(this._rangeMinLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		this._rangeActLabel = new St.Label({
			text: '',
			style_class: 'walnut-setvar-range-actual'
		});
		rangeValueBox.add(this._rangeActLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		this._rangeMaxLabel = new St.Label({ text: '' });
		rangeValueBox.add(this._rangeMaxLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		// Buttons
		this._minus = new Button({
			gicon: MiscIcons.Minus,
			// TRANSLATORS: Accessible name of 'Decrement' button @ setvar ranges
			accessibleName: _("Decrement by one"),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});
		rangeValueBox.insert_child_below(this._minus.actor, this._rangeActLabel);
		rangeValueBox.child_set(this._minus.actor);

		this._minus.actor.connect('button-release-event', Lang.bind(this, this._minusAction));
		this._minus.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {

			let key = event.get_key_symbol();

			if (key == Clutter.KEY_space || key == Clutter.KEY_Return)
				this._minusAction();

		}));

		this._plus = new Button({
			gicon: MiscIcons.Plus,
			// TRANSLATORS: Accessible name of 'Increment' button @ setvar ranges
			accessibleName: _("Increment by one"),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});
		rangeValueBox.insert_child_above(this._plus.actor, this._rangeActLabel);
		rangeValueBox.child_set(this._plus.actor);

		this._plus.actor.connect('button-release-event', Lang.bind(this, this._plusAction));
		this._plus.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {

			let key = event.get_key_symbol();

			if (key == Clutter.KEY_space || key == Clutter.KEY_Return)
				this._plusAction();

		}));

		let del = new Button({
			gicon: MiscIcons.Cancel,
			// TRANSLATORS: Accessible name of 'Undo and close' button @ setvar
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				// Reset submenu
				this._resetTo(this._actualValue);

				// Give focus back to our 'toggle button'
				this._parent._button.actor.grab_key_focus();

				// Close the setvarBox and change the ornament
				this._parent.fold();

			}),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});

		this._go = new Button({
			gicon: MiscIcons.OK,
			// TRANSLATORS: Accessible name of 'Set' button @ setvar
			accessibleName: _("Set"),
			callback: Lang.bind(this, function() {

				upsrwDo.setVar({
					device: upscMonitor.getList()[0],
					varName: this._varName,
					varValue: '%d'.format(this._valueToSet)
				});

				// Close the setvarBox and change the ornament
				this._parent.fold();

				// Close top menu
				this.itemActivated();

			}),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});

		// Buttons box
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-setvar-buttons-box'
		});
		btns.add(del.actor);
		btns.add(this._go.actor);
		rangeValueBox.add(btns);

		// Connect slider
		this._slider.connect('value-changed', Lang.bind(this, function(item) {

			let rangeWindow = this._rangeAct.max - this._rangeAct.min;

			// Get value
			this._valueToSet = this._rangeAct.min + Math.round(item._value * rangeWindow);

			// Update value's label
			this._rangeActLabel.text = '%d'.format(this._valueToSet);

			// Update buttons' clickability
			this._updateButtons();

		}));

		// 'Grab' the scroll (i.e. 'ungrab' it from the PopupSubMenu) when mouse is over the slider
		this._slider.actor.connect('enter-event', Lang.bind(this, function(actor, event) {
			if (event.is_pointer_emulated())
				return;
			this._parent._parent.actor.set_mouse_scrolling(false);
		}));

		// 'Ungrab' the scroll (i.e. give it back to the PopupSubMenu) when mouse leaves the slider
		this._slider.actor.connect('leave-event', Lang.bind(this, function(actor, event) {
			if (event.is_pointer_emulated())
				return;
			this._parent._parent.actor.set_mouse_scrolling(true);
		}));

		this._resetTo(args.actualValue);

		// Scroll the menu when items get key-focus
		sliderItem.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, self);
		}));
		this._minus.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		this._plus.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		del.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		this._go.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));

		this.hide();

	}

	// Actions to execute when 'minus' button gets activated
	_minusAction() {

		if (this._valueToSet <= this._rangeAct.min)
			this._valueToSet = this._rangeAct.min

		else if (this._valueToSet > this._rangeAct.max)
			this._valueToSet = this._rangeAct.max

		// this._rangeAct.min < this._valueToSet <= this._rangeAct.max
		else
			this._valueToSet--;

		// Update value's label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Update slider's appearance
		let rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
		rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

	}

	// Actions to execute when 'plus' button gets activated
	_plusAction() {

		if (this._valueToSet < this._rangeAct.min)
			this._valueToSet = this._rangeAct.min

		else if (this._valueToSet >= this._rangeAct.max)
			this._valueToSet = this._rangeAct.max

		// this._rangeAct.min <= this._valueToSet < this._rangeAct.max
		else
			this._valueToSet++;

		// Update value's label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Update slider's appearance
		let rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
		rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

	}

	// Change actual range to the one whose maximum and minimum settable value are args.*max* and args.*min*
	// args = {
	//	min: lower limit of the range
	//	max: upper limit of the range
	// }
	_changeRangeTo(args) {

		// Update actual range
		// - min
		this._rangeAct.min = args.min;
		this._rangeMinLabel.text = '%d'.format(this._rangeAct.min);
		// - max
		this._rangeAct.max = args.max;
		this._rangeMaxLabel.text = '%d'.format(this._rangeAct.max);

		// Reset this._valueToSet
		if (this._actualValueNumeric != undefined)
			this._valueToSet = this._actualValueNumeric;
		else
			this._valueToSet = this._rangeAct.min;
		// Actual value to set label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Slider
		let rangeActInRange = 0;
		if (this._valueToSet >= this._rangeAct.min && this._valueToSet <= this._rangeAct.max) {
			rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
			rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		} else if (this._valueToSet > this._rangeAct.max) {
			rangeActInRange = 1;
		}
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

		// Remove old ranges, if any
		if (this._rangeItems && this._rangeItems.length)
			for (let i = 0; i < this._rangeItems.length; i++)
				this._rangeItems[i].destroy();
		// Add settable ranges
		this._rangeItems = [];
		if (this._ranges.length > 1)
			for (let i = 0; i < this._ranges.length; i++) {
				let range = this._ranges[i];
				// The item represents actual range
				if (this._rangeAct.min == range.min && this._rangeAct.max == range.max)
					this._rangeItems[i] = new SetvarRangeItem({ range: range });
				else
					this._rangeItems[i] = new SetvarRangeItem({
						range: range,
						callback: Lang.bind(this, this._changeRangeTo)
					});
				this.addMenuItem(this._rangeItems[i]);
				// Scroll the menu when item gets key-focus
				this._rangeItems[i].actor.connect('key-focus-in', Lang.bind(this, function(self) {
					if (self.get_hover())
						return;
					Util.ensureActorVisibleInScrollView(this._scrollView, self);
				}));
			}

	}

	// 'Set' button is usable only when this._valueToSet != actual value; +/- buttons are usable only when value is in the range and not the respective range limit
	_updateButtons() {

		if (
			this._actualValueNumeric == undefined ||
			this._actualValueNumeric != this._valueToSet
		) {
			this._go.actor.reactive = true;
			this._go.actor.can_focus = true;
		} else {
			this._go.actor.reactive = false;
			this._go.actor.can_focus = false;
		}

		if (this._valueToSet > this._rangeAct.min) {
			this._minus.actor.reactive = true;
			this._minus.actor.can_focus = true;
		} else {
			this._minus.actor.reactive = false;
			this._minus.actor.can_focus = false;
		}

		if (this._valueToSet < this._rangeAct.max) {
			this._plus.actor.reactive = true;
			this._plus.actor.can_focus = true;
		} else {
			this._plus.actor.reactive = false;
			this._plus.actor.can_focus = false;
		}

	}

	// Reset setvar box to *value*
	_resetTo(value) {

		this._actualValue = value;
		this._actualValueNumeric = Number(this._actualValue);

		let rangeAct = {};

		// Actual value is an acceptable number
		if (!isNaN(this._actualValueNumeric) && isFinite(this._actualValueNumeric)) {

			// Ranges only support ints
			this._actualValueNumeric = parseInt(this._actualValue);

			for (let i = 0; i < this._ranges.length; i++) {
				let range = this._ranges[i];
				if (!(this._actualValueNumeric >= range.min && this._actualValueNumeric <= range.max))
					continue;
				rangeAct.min = range.min;
				rangeAct.max = range.max;
				break;
			}

			// Actual value is out of the available ranges, choose the nearest one
			if (rangeAct.min == null || rangeAct.max == null) {
				if (this._ranges.length > 1) {
					let delta;
					for (let i = 0; i < this._ranges.length; i++) {
						let range = this._ranges[i];
						let localDelta;
						// Less than minimum
						if (this._actualValueNumeric < range.min)
							localDelta = range.min - this._actualValueNumeric;
						// Greater than maximum
						else
							localDelta = this._actualValueNumeric - range.max;
						if (delta == undefined || localDelta < delta) {
							delta = localDelta;
							rangeAct.min = range.min;
							rangeAct.max = range.max;
						}
					}
				} else {
					rangeAct.min = this._ranges[0].min;
					rangeAct.max = this._ranges[0].max;
				}
			}

		// Actual value is not an acceptable number -> use first available range
		} else {

			rangeAct.min = this._ranges[0].min;
			rangeAct.max = this._ranges[0].max;
			this._actualValueNumeric = undefined;

		}

		this._changeRangeTo(rangeAct);

	}

	// Move key focus to the slider
	focusSlider() {

		this._slider.actor.get_parent().grab_key_focus();

	}
};

// SetvarEnumItem: one of the enumerated values displayed in SetvarBoxEnums
const	SetvarEnumItem = class extends PopupMenu.PopupMenuItem {

	// args = {
	//	enumValue: enumerated value this item represents
	//	callback: function to call when activated; if not set, the item is treated (and represented) as the actually chosen one
	// }
	constructor(args) {

		if (args.callback != null) {
			super(args.enumValue);
			this.connect('activate', args.callback);
		} else {
			super(args.enumValue, { activate: false });
			// Set the item as checked if it represents actual value
			this.setOrnament(PopupMenu.Ornament.DOT);
		}

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this.actor.insert_child_below(spacer, this._ornamentLabel)

	}
};

// SetvarBoxEnums: box to set r/w variables with enumerated values
const	SetvarBoxEnums = class extends SetvarBox {

	// args = {
	//	varName: name of the settable variable
	//	enums: available enumerated values of the settable variable
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	constructor(args) {

		super({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// enums: {
		//	enum1,
		//	enum2,
		//	enum3,
		//	...
		// }
		this._enums = args.enums;

		// Reset to actual value
		this._resetTo(args.actualValue);

		this.hide();

	}

	// Reset setvar box to *value*
	_resetTo(value) {

		if (this._actualValue != undefined && this._actualValue == value)
			return;

		// Update actual value
		this._actualValue = value;

		// Remove old enums, if any
		if (this._enumItems && this._enumItems.length)
			for (let i = 0; i < this._enumItems.length; i++)
				this._enumItems[i].destroy();
		// Add settable enums
		this._enumItems = [];
		// Iterate through all the enumerated values
		for (let i = 0; i < this._enums.length; i++) {
			let enumValue = this._enums[i];
			// The item represents actual value
			if (
				enumValue == this._actualValue ||
				// Take into account different notations for numbers
				(
					!isNaN(Number(enumValue)) &&
					isFinite(Number(enumValue)) &&
					!isNaN(Number(this._actualValue)) &&
					isFinite(Number(this._actualValue)) &&
					parseFloat(enumValue) == parseFloat(this._actualValue)
				)
			)
				this._enumItems[i] = new SetvarEnumItem({ enumValue: enumValue });
			else
				this._enumItems[i] = new SetvarEnumItem({
					enumValue: enumValue,
					callback: Lang.bind(this, function() {
						upsrwDo.setVar({
							device: upscMonitor.getList()[0],
							varName: this._varName,
							varValue: enumValue
						});
						this._parent.fold();
					})
				});

			this.addMenuItem(this._enumItems[i]);
			// Scroll the menu when item gets key-focus
			this._enumItems[i].actor.connect('key-focus-in', Lang.bind(this, function(self) {
				if (self.get_hover())
					return;
				Util.ensureActorVisibleInScrollView(this._scrollView, self);
			}));
		}

	}
};

// SetvarBoxString: box to set r/w string variables
const	SetvarBoxString = class extends SetvarBox {

	// args = {
	//	varName: name of the settable variable
	//	len: maximum length of the settable string
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	constructor(args) {

		super({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// Max length of the string
		this._maxLength = args.len;

		// Actual value
		this._actualValue = args.actualValue;

		let container = new St.BoxLayout({
			can_focus: false,
			track_hover: false,
			style_class: 'popup-menu-item',
            x_expand: true,
            y_expand: true
		});
		this.actor.add(container);

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		container.add(spacer);

		// Error box
		this._errorBox = new St.BoxLayout({
			can_focus: false,
			track_hover: false,
			style_class: 'popup-menu-item'
		});
		this.actor.add(this._errorBox);

		// Spacer
		let errorSpacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this._errorBox.add(errorSpacer);

		// Error Icon
		let errorIcon = new St.Icon({
			gicon: MiscIcons.Error,
			style_class: 'walnut-setvar-string-error-icon'
		});
		this._errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });

		// Error message
		let errorText = new St.Label({
			// TRANSLATORS: Error message @ string setvar
			text: _("String too long"),
			style_class: 'walnut-setvar-string-error-text'
		});
		this._errorBox.add(errorText, {
			expand: true,
			y_align: St.Align.MIDDLE,
			y_fill: false
		});

		this._errorBox.hide();

		this._entry = new St.Entry({
			text: '',
			// TRANSLATORS: Hint text @ string setvar
			hint_text: _("set this variable to.."),
			can_focus: true,
			reactive: true,
			style_class: 'walnut-setvar-string-entry',
            x_expand: true,
            y_expand: true
		});
		container.add(this._entry);

		this._entry.clutter_text.connect('text-changed', Lang.bind(this, function() {

			this._valueToSet = this._entry.get_text();

			if (this._maxLength && this._valueToSet.trim().length > this._maxLength)
				this._errorBox.show();
			else
				this._errorBox.hide();

			this._updateOkButton();

		}));

		// Buttons
		let del = new Button({
			gicon: MiscIcons.Cancel,
			// TRANSLATORS: Accessible name of 'Undo and close' button @ setvar
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				// Reset submenu
				this._resetTo(this._actualValue);

				// Give focus back to our 'toggle button'
				this._parent._button.actor.grab_key_focus();

				// Close the setvarBox and toggle the 'expander'
				this._parent.fold();

			}),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});

		this._go = new Button({
			gicon: MiscIcons.OK,
			// TRANSLATORS: Accessible name of 'Set' button @ setvar
			accessibleName: _("Set"),
			callback: Lang.bind(this, function() {

				upsrwDo.setVar({
					device: upscMonitor.getList()[0],
					varName: this._varName,
					varValue: this._valueToSet.trim()
				});

				// Close the setvarBox and change the ornament
				this._parent.fold();

				// Close top menu
				this.itemActivated();

			}),
			size: 'small'/**/,
			x_expand: false,
			y_expand: false/**/
		});

		this._valueToSet = this._actualValue;

		this._updateOkButton();

		// Buttons box
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-setvar-buttons-box'
		});
		btns.add(del.actor);
		btns.add(this._go.actor);
		container.add(btns);

		// Scroll the menu when items get key-focus
		this._entry.clutter_text.connect('key-focus-in', Lang.bind(this, function(self) {
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));
		del.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));
		this._go.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));

		this.hide();

	}

	// 'Set' button is usable only when this._valueToSet != actual value
	_updateOkButton() {

		let len = this._valueToSet.trim().length;

		if (this._actualValue != this._valueToSet && len > 0 && (!this._maxLength || len <= this._maxLength)) {
			this._go.actor.reactive = true;
			this._go.actor.can_focus = true;
		} else {
			this._go.actor.reactive = false;
			this._go.actor.can_focus = false;
		}

	}

	// Reset setvar box to *value*
	_resetTo(value) {

		this._actualValue = value;

		this._entry.text = '';

		this._valueToSet = value;

		this._errorBox.hide();

		this._updateOkButton();

	}
};

// RawDataButton: expander/name/value
const	RawDataButton = GObject.registerClass(
class	RawDataButton extends PopupMenu.PopupBaseMenuItem {

	// args = {
	//	varName: name of the variable
	//	varValue: actual value of the variable
	//	setvarBox: child setvar box; if not set, the item won't be activatable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init(args) {

		if (args.setvarBox != null) {
			super._init();
			this.actor.add_accessible_state(Atk.StateType.EXPANDABLE);
			this.setOrnament(RawDataButtonOrnament.CLOSED);
		} else {
			super._init({ activate: false });
		}

		this._setvarBox = args.setvarBox;

		// Variable's name
		this._varName = new St.Label({
			text: '',
            //x_expand: true,
            y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.varName = args.varName;
		this.actor.add(this._varName);
		this.actor.label_actor = this._varName;

		// Variable's value
		this._varValue = new St.Label({
			text: '',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.varValue = args.varValue;
		this.actor.add(this._varValue);

		// Scroll the menu when items get key-focus
		this._scrollView = args.scrollView;
		this.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, self);
		}));

	}

	_toggle() {

		if (this._setvarBox == null)
			return;

		if (this._setvarBox.isClosed()) {
			this._setvarBox.show({ actualValue: this.varValue });
			this.setOrnament(RawDataButtonOrnament.OPENED);
		} else {
			this._setvarBox.hide();
			this.setOrnament(RawDataButtonOrnament.CLOSED);
		}

	}

	close() {

		if (this._setvarBox == null)
			return;

		if (this._setvarBox.isClosed())
			return;

		this._setvarBox.hide();
		this.setOrnament(RawDataButtonOrnament.CLOSED);

	}

	activate(event) {

		if (this._setvarBox != null)
			this._toggle();

	}

	setOrnament(ornament) {

		if (ornament == this._ornament)
			return;

		this._ornament = ornament;

		if (ornament == RawDataButtonOrnament.CLOSED) {
			this._ornamentLabel.text = '+';
			this.actor.remove_accessible_state(Atk.StateType.EXPANDED);
		} else if (ornament == RawDataButtonOrnament.OPENED) {
			this._ornamentLabel.text = '-';
			this.actor.add_accessible_state(Atk.StateType.EXPANDED);
		} else if (ornament == RawDataButtonOrnament.NONE) {
			this._ornamentLabel.text = '';
			this.actor.remove_accessible_state(Atk.StateType.EXPANDED);
		}

	}

	get varName() {

		return this._varName.get_clutter_text().text;

	}

	set varName(name) {

		this._varName.text = Utilities.parseText(name, Lengths.RAW_VAR, '.');

	}

	get varValue() {

		return this._varValue.get_clutter_text().text;

	}

	set varValue(value) {

		this._varValue.text = Utilities.parseText(value, Lengths.RAW_VALUE);

	}
});

// UpsRawDataItem: each item of the raw data submenu
const	UpsRawDataItem = class extends PopupMenu.PopupMenuSection {

	// args = {
	//	varName: name of the variable
	//	varValue: actual value of the variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	constructor(args) {

		super();

		// Variable's name/value
		this._varName = args.varName;
		this._varValue = args.varValue;

		// Set scrollView
		this._scrollView = args.scrollView;

		// Expander/name/value container
		this._button = new RawDataButton({
			varName: this._varName,
			varValue: this._varValue,
			scrollView: this._scrollView
		});
		this.addMenuItem(this._button);

	}

	get varName() {

		return this._varName;

	}

	set varName(name) {

		this._varName = name;
		this._button.varName = name;

	}

	get varValue() {

		return this._varValue;

	}

	set varValue(value) {

		this._varValue = value;
		this._button.varValue = value;

	}

	// Common function for adding a SetvarBox
	_addSetvarBox() {

		// Expander/name/value container
		let button = new RawDataButton({
			varName: this._varName,
			varValue: this._button.varValue,
			setvarBox: this.setvarBox,
			scrollView: this._scrollView
		});
		this._button.destroy();
		this._button = button;
		this.addMenuItem(this._button);

		this.addMenuItem(this.setvarBox);

	}

	// Add a SetvarBox for ranges
	// args = {
	//	ranges: available ranges of the settable variable
	//	actualValue: actual value of the settable variable
	// }
	setVarRange(args) {

		this.setvarBox = new SetvarBoxRanges({
			varName: this.varName,
			ranges: args.ranges,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	}

	// Add a SetvarBox for enumerated values
	// args = {
	//	enums: available enumerated values of the settable variable
	//	actualValue: actual value of the settable variable
	// }
	setVarEnum(args) {

		this.setvarBox = new SetvarBoxEnums({
			varName: this.varName,
			enums: args.enums,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	}

	// Add a SetvarBox for strings
	// args = {
	//	len: maximum length of the settable string
	//	actualValue: actual value of the settable variable
	// }
	setVarString(args) {

		this.setvarBox = new SetvarBoxString({
			varName: this.varName,
			len: args.len,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	}

	// fold: close the setvarBox, change button ornament
	fold() {

		if (this._button != null)
			this._button.close();

	}
};

// UpsRawDataList: list UPS's raw data in a submenu
const	UpsRawDataList = GObject.registerClass(
class	UpsRawDataList extends PopupMenu.PopupSubMenuMenuItem {

	_init() {

		// TRANSLATORS: Label of raw data submenu
		super._init(_("Raw Data"));

	}

	_buildInfo() {

		// Actual submenu children (children of this.menu.box of type PopupMenuSection or PopupBaseMenuItem -> our own UpsRawDataItem)
		let actual;

		// Object where keys are variables' names (battery.charge, ups.status..) that stores the original position of the children (used to delete vars no longer available)
		let stored = {};

		// Array of variables' names of the submenu's children (used to sort new vars alphabetically)
		let ab = [];

		// Submenu has children
		if (!this.menu.isEmpty()) {

			actual = this.menu._getMenuItems();

			for (let i = 0; i < actual.length; i++) {

				// e.g.: stored['battery.charge'] = '0';
				stored[actual[i].varName] = '%d'.format(i);

				// e.g.: ab[0] = 'battery.charge';
				ab[i] = actual[i].varName;

			}

		}

		// this._vars = {
		//	'battery.charge': '100',
		//	'ups.status': 'OL',
		//		...
		// }

		// Make sure vars are alphabetically ordered
		let orderedVars = [];

		for (let variable in this._vars)
			orderedVars.push(variable);

		orderedVars.sort();

		for (let i = 0; i < orderedVars.length; i++) {

			let item = orderedVars[i];

			// Submenu has children and the current var is one of them
			if (actual && stored[item]) {

				// -> update only the variable's value
				this['_' + item].varValue = this._vars[item];

				// Handle setvars
				this._handleSetVar({
					var: item,
					value: this._vars[item]
				});

				// and delete it from stored -> we won't delete this var
				delete stored[item];

			// Submenu doesn't have children or the current var isn't one of them
			} else {

				// Already added vars are alphabetically ordered, but, if a new var arises (e.g. ups.alarm)
				// now we have to insert new items so that they are alphabetically ordered

				let position;

				// ab ? -> the submenu has already children
				if (ab) {

					// add new var to array
					ab.push(item);

					// and sort the lengthened array alphabetically
					ab.sort();

					// ..finally get the position
					position = ab.indexOf(item);

				}

				this['_' + item] = new UpsRawDataItem({
					varName: item,
					varValue: this._vars[item],
					scrollView: this.menu.actor
				});

				// Handle setvars
				this._handleSetVar({
					var: item,
					value: this._vars[item]
				});

				// If the var is a new one in an already ordered submenu, add it in the right position
				if (position)
					this.menu.addMenuItem(this['_' + item], position);
				// If the var is new as well as the submenu add it at the default position, as vars are already alphabetically ordered
				else
					this.menu.addMenuItem(this['_' + item]);

			}

		}

		// Destroy all children still stored in 'stored' obj
		for (let item in stored) {
			actual[item].destroy();
		}

	}

	// If we have setvars and item is one of them, add its SetvarBox
	_handleSetVar(item) {

		// No setvars
		if (!upsrwDo.hasSetVars())
			return;

		let setVars = upsrwDo.getSetVars();

		if (setVars[item.var] && !this['_' + item.var].setvarBox) {

			let setVar = setVars[item.var];

			if (setVar.type == 'STRING')
				this['_' + item.var].setVarString({
					len: setVar.opts,
					actualValue: item.value
				});

			else if (setVar.type == 'ENUM')
				this['_' + item.var].setVarEnum({
					enums: setVar.opts,
					actualValue: item.value
				});

			else if (setVar.type == 'RANGE')
				this['_' + item.var].setVarRange({
					ranges: setVar.opts,
					actualValue: item.value
				});

			return;

		}

	}

	// Update variables and show the menu if not already visible
	// args = {
	//	vars: device's variables
	//	forceRefresh: boolean, whether to destroy the menu and rebuild it or not
	// }
	update(args) {

		if (args.forceRefresh && !this.menu.isEmpty())
			this.menu.removeAll();

		if (!this.actor.visible)
			this.show();

		this._vars = args.vars;

		this._buildInfo();

	}

	// Hide the menu and, if it's not empty, destroy all children
	hide() {

		// If the submenu is not empty (e.g. we don't want anymore to display Raw Var submenu in panel menu), destroy all children
		if (!this.menu.isEmpty())
			this.menu.removeAll();

		//this.actor.hide();

	}

	show() {

		//this.actor.show();

	}
});

// UpsDataTableAlt: Alternative, less noisy, data table
const	UpsDataTableAlt = class extends PopupMenu.PopupMenuSection {

	constructor() {

		super();

		for (let data in DataTableItems) {

			let item = DataTableItems[data];

			// Create item
			this['_' + data] = new UpsDataTableAltItem();

			// Populate item
			this['_' + data].setLabel(item.label());
			if (!(item.gicon instanceof Function))
				this['_' + data].setIcon(item.gicon);

			// Add item
			this.addMenuItem(this['_' + data]);

		}

	}

	// Hide an item or the whole table (if type is not specified)
	// args = {
	//	type: type of the data to hide
	// }
	hide(args) {

		if (!args || !args.type) {
			this.actor.hide();
			return;
		}

		let data = args.type;
		this['_' + data].hide();

		// If nothing else is visible, also hide the whole thing
		for (data in DataTableItems)
			if (this['_' + data].actor.visible)
				return;
		this.actor.hide();

	}

	// Show item/table and update table's data/icons
	// args = {
	//	type: type of the data to update
	//	value: actual value of this type of data
	// }
	show(args) {

		this.actor.show();

		let data = args.type;
		let value = args.value;

		let item = DataTableItems[data];

		if (item.gicon instanceof Function)
			this['_' + data].setIcon(item.gicon(value));

		this['_' + data].setValue(item.value(value));

		this['_' + data].show();

	}
};

// UpsDataTableAltItem: Alternative, less noisy, data table - item
const	UpsDataTableAltItem = GObject.registerClass(
class	UpsDataTableAltItem extends PopupMenu.PopupBaseMenuItem {

	_init() {

		super._init({ activate: false });

		// Icon
		this.icon = new St.Icon({ style_class: 'popup-menu-icon' });
		this.actor.add(this.icon);

		// Label
		this.label = new St.Label({
			text: '',
			y_expand: true,
			//x_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add(this.label);
		this.actor.label_actor = this.label;

		// Value
		this.value = new St.Label({
			text: '',
			style_class: 'popup-status-menu-item',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add(this.value);

	}

	setIcon(gicon) {

		this.icon.gicon = gicon;

	}

	setLabel(label) {

		this.label.text = label;

	}

	setValue(value) {

		this.value.text = value;

	}

	hide() {

		//this.actor.hide();

	}

	show() {

		//this.actor.show();

	}
});

// UpsTopDataList: List (if available/any) ups.{status,alarm}
const	UpsTopDataList = GObject.registerClass(
class	UpsTopDataList extends PopupMenu.PopupBaseMenuItem {

	_init() {

		super._init({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let container = new St.Bin();

		let dataBox = new St.BoxLayout({
			vertical: true,
			style_class: 'walnut-ups-top-data-box'
		});

		container.set_child(dataBox);

		// Device status
		this.statusIcon = new St.Icon({
			gicon: MiscIcons.DeviceStatus,
			style_class: 'walnut-ups-top-data-icon'
		});
		this.statusLabel = new St.Label({ style_class: 'walnut-ups-top-data-label' });
		this.statusText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let statusDescBox = new St.BoxLayout({ vertical: true });
		statusDescBox.add_actor(this.statusLabel);
		statusDescBox.add_actor(this.statusText);

		// Icon + desc box
		let statusBox = new St.BoxLayout({ style_class: 'popup-menu-item walnut-ups-top-data-status-box' });
		statusBox.add_actor(this.statusIcon);
		statusBox.add_actor(statusDescBox);

		// Alarm
		this.alarmIcon = new St.Icon({
			gicon: MiscIcons.Alarm,
			style_class: 'walnut-ups-top-data-icon'
		});
		let alarmLabel = new St.Label({
			// TRANSLATORS: Label of device alarm box
			text: _("Alarm!"),
			style_class: 'walnut-ups-top-data-label'
		});
		this.alarmText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let alarmDescBox = new St.BoxLayout({ vertical: true });
		alarmDescBox.add_actor(alarmLabel);
		alarmDescBox.add_actor(this.alarmText);

		// Icon + desc box
		this.alarmBox = new St.BoxLayout({ style_class: 'popup-menu-item walnut-ups-top-data-alarm-box' });
		this.alarmBox.add_actor(this.alarmIcon);
		this.alarmBox.add_actor(alarmDescBox);

		// Add to dataBox
		dataBox.add_actor(statusBox);
		dataBox.add_actor(this.alarmBox);

		this.actor.add(container);

	}

	// Update displayed data
	// args = {
	//	type: type of the data to update {'S','A'}
	//	value: actual value of this type of data
	// }
	update(args) {

		switch (args.type)
		{
		case 'S':	// Device status

			let status = Utilities.parseStatus(args.value);

			this.statusLabel.text = status.line;
			this.statusText.text = Utilities.parseText(status.status, Lengths.TOPDATA);
			this.statusIcon.style_class = 'popup-menu-icon';

			break;

		case 'A':	// Alarm

			this.alarmText.text = Utilities.parseText(args.value, Lengths.TOPDATA);
			this.alarmIcon.style_class = 'popup-menu-icon';

			if (!this.alarmBox.visible)
				this.alarmBox.show();

			break;

		default:

			break;

		}

	}

	// args = {
	//	type: type of the data to hide {'S','A'}
	// }
	hide(args) {

		// All UpsTopDataList
		if (!args || !args.type) {
			//this.actor.hide();
			return;
		}

		// Alarm
		if (args.type == 'A' && this.alarmBox.visible) {
			this.alarmText.text = '';
			this.alarmBox.hide();
		}

	}

	show() {

		//this.actor.show();

	}
});

// UpsModel: List chosen UPS's model/manufacturer (if available)
const	UpsModel = GObject.registerClass(
class	UpsModel extends PopupMenu.PopupBaseMenuItem {

	_init() {

		super._init({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		this.label = new St.Label({
			style_class: 'walnut-ups-model',
            x_expand: true,
            y_expand: true
		});

		this.actor.add(this.label);

	}

	hide() {

		this.label.text = '';

		//this.actor.hide();

	}

	// args = {
	//	manufacturer: UPS manufacturer
	//	model: UPS model
	// }
	show(args) {

		let mfr = args.manufacturer;
		let model = args.model;

		let text = '';

		if (mfr && model) {
			if ((mfr.length + model.length) < Lengths.MODEL)
				text = '%s - %s'.format(mfr, model);
			else
				text = '%s\n%s'.format(Utilities.parseText(mfr, Lengths.MODEL), Utilities.parseText(model, Lengths.MODEL));
		} else {
			text = Utilities.parseText((mfr || model), Lengths.MODEL);
		}

		this.label.text = text;

		//this.actor.show();

	}
});

// UpsList: a submenu listing available UPSes in a upsc-like way (i.e. ups@hostname:port)
const	UpsList = GObject.registerClass(
class	UpsList extends PopupMenu.PopupSubMenuMenuItem {

	_init() {

		super._init('');

	}

	_buildInfo() {

		// Counter used to decide whether the submenu will be sensitive or not: only 1 entry -> not sensitive, 2+ entries -> sensitive
		let count = 0;

		for (let i = 0; i < this._devices.length; i++) {

			let label;

			let item = this._devices[i];

			label = '%s@%s:%s'.format(item.name, item.host, item.port);

			// N/A
			if (item.av != 1)
				// TRANSLATORS: Device not available @ devices list
				label += _(" (N/A)");

			if (i == 0) {
				this.label.text = label;
				continue;
			}

			let ups_l = new PopupMenu.PopupMenuItem(label);

			let index = i;

			ups_l.connect('activate', Lang.bind(this, function() {
				Utilities.setAsDefaultUPS(index);
			}));

			// N/A -> Style = popup-menu-item:insensitive
			if (item.av != 1) {

				ups_l.actor.add_style_pseudo_class('insensitive');

				// If !display-na: UPSes not currently available won't be shown (apart from the chosen one)
				if (this._display_na == false)
					continue;

			}

			count++;

			this.menu.addMenuItem(ups_l);

			// Scroll the parent menu when item gets key-focus
			ups_l.actor.connect('key-focus-in', Lang.bind(this, function(self) {
				if (self.get_hover())
					return;
				Util.ensureActorVisibleInScrollView(this.menu.actor, self);
			}));

		}

		// Submenu sensitive or not
		if ((this._display_na == false && count == 0) || this._devices.length == 1)
			this.setSensitive(false);
		else
			this.setSensitive(true);

	}

	// Empty the submenu and update it with the new device list
	// args = {
	//	devices: available devices
	// }
	update(args) {

		// Update device list
		this._devices = args.devices;

		// Destroy all previously added items, if any
		if (this.menu._getMenuItems().length)
			this.menu.removeAll();

		// Display also not available UPSes, if at least one of the 'not chosen' is available:
		//  - display-na: Display also not available UPSes
		//  - !display-na: Display chosen UPS and then only available UPSes
		this._display_na = gsettings.get_boolean('display-na');

		// Rebuild submenu
		this._buildInfo();

	}

	hide() {

		// If the submenu is not empty, destroy all children
		if (!this.menu.isEmpty())
			this.menu.removeAll();

		//this.actor.hide();

	}

	show() {

		//this.actor.show();

	}
});

// ErrorBox: a box to display errors (if any)
const	ErrorBox = GObject.registerClass(
class	ErrorBox extends PopupMenu.PopupBaseMenuItem {

	_init() {

		super._init({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let eBox = new St.BoxLayout({
			vertical: false,
			x_expand: true,
			y_expand: true
		});

		// Box for the message
		let textBox = new St.BoxLayout({ vertical: true, y_align: St.Align.START });

		// Icon
		let icon = new St.Icon({
			gicon: MiscIcons.Error,
			style_class: 'walnut-error-icon',
			x_expand: true,
			y_expand: false,
			x_align: St.Align.END,
			y_align: St.Align.MIDDLE
		});
		eBox.add(icon);

		// Error label
		this.label = new St.Label({ style_class: 'walnut-error-label' });
		textBox.add(this.label);

		// Error description
		this.desc = new St.Label({ style_class: 'walnut-error-desc' });
		textBox.add(this.desc);

		eBox.add(textBox);

		this.actor.add(eBox);

	}

	hide() {

		this.label.text = '';
		this.desc.text = '';

		//this.actor.hide();

	}

	show(type) {

		let label, desc;

		// Unable to find any UPS -> ErrorType.NO_UPS
		if (type & ErrorType.NO_UPS) {

			// TRANSLATORS: Error label NO UPS @ main menu
			label = _("Error! No UPS found");

			// TRANSLATORS: Error description NO UPS @ main menu
			desc = _("walNUT can't find any UPS, please add one hostname:port to search in");

		// Currently chosen UPS not available -> ErrorType.UPS_NA
		} else {

			// TRANSLATORS: Error label UPS NOT AVAILABLE @ main menu
			label = _("Error! UPS not available");

			// TRANSLATORS: Error description UPS NOT AVAILABLE @ main menu
			desc = _("walNUT can't communicate to chosen UPS, please select or add another one or check your installation");

		}

		this.label.text = Utilities.parseText(label, Lengths.ERR_LABEL);
		this.desc.text = Utilities.parseText(desc, Lengths.ERR_DESC);

		//this.actor.show();

	}
});

// Panel menu
const	walNUTMenu = class extends PopupMenu.PopupMenu {

	// args = {
	//	sourceActor: actor of the menu's parent
	// }
	constructor(args) {

		super(args.sourceActor, 0.0, St.Side.TOP);

		// Override base style
		this.actor.add_style_class_name('walnut-menu');
		// Highlight Gnome Shell version
		let [ major, minor ] = Config.PACKAGE_VERSION.split('.');
		this.actor.add_style_class_name('walnut-gs-%s-%s'.format(major, minor));

		// Error Box
		this.errorBox = new ErrorBox();
		this.errorBox.hide();

		// Devices list
		this.upsList = new UpsList();
		this.upsList.hide();

		// Chosen UPS's data
		// Model/manufacturer
		this.upsModel = new UpsModel();
		this.upsModel.hide();
		// Device status/alarm
		this.upsTopDataList = new UpsTopDataList;
		this.upsTopDataList.hide();
		// Battery charge, battery runtime, device load, device temperature
		this.upsDataTableAlt = new UpsDataTableAlt();
		this.upsDataTableAlt.hide();

		// Separator between chosen UPS's data & raw data/UPS commands
		this.separator = new PopupMenu.PopupSeparatorMenuItem();
		this.separator.actor.hide();

		// UPS Raw Data
		this.upsRaw = new UpsRawDataList();
		this.upsRaw.hide();
		// UPS Commands
		this.upsCmdList = new UpsCmdList();
		this.upsCmdList.hide();

		// Box for bottom buttons functions
		this.credBox = new CredBox();
		this.addBox = new AddBox(this);
		this.delBox = new DelBox();

		// Bottom buttons
		this.controls = new BottomControls();

		// Put menu together

		// Devices list
		this.addMenuItem(this.upsList);

		// Error Box
		this.addMenuItem(this.errorBox);

		// Top data - Manufacturer & model, status & alarm, battery {charge,runtime} & device {load,temperature}
		this.addMenuItem(this.upsModel);
		this.addMenuItem(this.upsTopDataList);
		this.addMenuItem(this.upsDataTableAlt);

		// Separator - Raw Data / UPS Commands
		this.addMenuItem(this.separator);
		this.addMenuItem(this.upsRaw);
		this.addMenuItem(this.upsCmdList);

		// Separator - Bottom buttons and their boxes
		this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.addMenuItem(this.credBox);
		this.addMenuItem(this.addBox);
		this.addMenuItem(this.delBox);
		this.addMenuItem(this.controls);

	}
};

// Start!
let	gsettings,
	upscMonitor,	// ups (vars/status) monitor
	upsrwDo,	// rw variables handler
	upscmdDo,	// instant commands handler
	walnut;		// Panel/menu

// Init extension
function init(extensionMeta) {

	gsettings = Convenience.getSettings();
	Convenience.initTranslations();

}

// Enable Extension
function enable() {

	upscMonitor = new UpscMonitor();

	upsrwDo = new UpsrwDo();

	upscmdDo = new UpscmdDo();

	walnut = new walNUT();

	Main.panel.addToStatusArea('walNUT', walnut);

}

// Disable Extension
function disable() {

	walnut.destroy();
	walnut = null;

	upscMonitor.destroy();
	upscMonitor = null;

	upsrwDo = null;

	upscmdDo = null;

}
