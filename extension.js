import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { panel } from 'resource:///org/gnome/shell/ui/main.js';
import GLib from 'gi://GLib';

const QUICK_SETTINGS_INIT_RETRY_MS = 100;

export default class IndicatorVisibilityToolExtension extends Extension {
	enable() {
		this._settings = this.getSettings('org.gnome.shell.extensions.IndicatorVisibilityTool');
		this._signals = new Map();
		this._indicatorSignals = new Map();
		this._naturalVisibility = new Map();
		this._applyingVisibility = new Set();
		this._indicators = null;
		this._settingsChangedId = 0;

		this._initializationSourceId = GLib.timeout_add(
			GLib.PRIORITY_DEFAULT,
			QUICK_SETTINGS_INIT_RETRY_MS,
			() => {
				const quickSettings = panel.statusArea?.quickSettings;
				if (!quickSettings?._system)
					return GLib.SOURCE_CONTINUE;

				this._initializationSourceId = 0;
				this._indicators = {
					'system-mode':        quickSettings._system,
					'unsafe-mode':        quickSettings._unsafeMode,
					'volume-output-mode': quickSettings._volumeOutput,
					'rfkill-mode':        quickSettings._rfkill,
					'bluetooth-mode':     quickSettings._bluetooth,
					'network-mode':       quickSettings._network,
					'night-light-mode':   quickSettings._nightLight,
					'thunderbolt-mode':   quickSettings._thunderbolt,
					'location-mode':      quickSettings._location,
					'volume-input-mode':  quickSettings._volumeInput,
					'camera-mode':        quickSettings._camera,
					'remote-access-mode': quickSettings._remoteAccess,
				};

				this._settingsChangedId = this._settings.connect(
					'changed', this._updateIndicators.bind(this));

				for (const [key, indicator] of Object.entries(this._indicators)) {
					if (!indicator)
						continue;

					const indicatorActor = indicator._indicator;
					if (indicatorActor) {
						this._naturalVisibility.set(indicatorActor, indicatorActor.visible);
						const actorSignalId = indicatorActor.connect(
							'notify::visible',
							() => this._onIndicatorActorVisibilityChanged(
								key, indicator, indicatorActor));
						this._indicatorSignals.set(indicatorActor, actorSignalId);
					}

					const signalId = indicator.connect(
						'notify::visible',
						() => this._onIndicatorVisibilityChanged(key, indicator));
					this._signals.set(indicator, signalId);
					this._updateIndicatorVisibility(key, indicator);
				}

				return GLib.SOURCE_REMOVE;
			});
	}

	disable() {
		if (this._initializationSourceId) {
			GLib.Source.remove(this._initializationSourceId);
			this._initializationSourceId = 0;
		}

		if (this._settingsChangedId)
			this._settings.disconnect(this._settingsChangedId);

		this._signals.forEach((signalId, indicator) => {
			if (indicator && signalId)
				indicator.disconnect(signalId);
		});
		this._indicatorSignals.forEach((signalId, indicatorActor) => {
			if (indicatorActor && signalId)
				indicatorActor.disconnect(signalId);
		});

		for (const indicator of Object.values(this._indicators || {})) {
			if (indicator)
				this._restoreIndicatorVisibility(indicator);
		}

		this._indicators = null;
		this._settings = null;
		this._settingsChangedId = 0;
		this._signals.clear();
		this._indicatorSignals.clear();
		this._naturalVisibility.clear();
		this._applyingVisibility.clear();
	}

	_updateIndicators() {
		for (const [key, indicator] of Object.entries(this._indicators || {})) {
			if (indicator)
				this._updateIndicatorVisibility(key, indicator);
		}
	}

	_onIndicatorActorVisibilityChanged(key, indicator, actor) {
		if (this._applyingVisibility.has(actor))
			return;

		this._naturalVisibility.set(actor, actor.visible);
		const mode = this._settings.get_string(key);
		if (mode === 'shown')
			this._setActorVisibility(actor, true);
		else if (mode === 'default')
			this._syncIndicatorVisibility(indicator);
	}

	_onIndicatorVisibilityChanged(key, indicator) {
		const mode = this._settings.get_string(key);
		if (mode === 'hidden')
			this._setActorVisibility(indicator, false);
		else if (mode === 'shown')
			this._setActorVisibility(indicator, true);
		else if (mode === 'default')
			this._syncIndicatorVisibility(indicator);
	}

	_updateIndicatorVisibility(key, indicator) {
		const mode = this._settings.get_string(key);

		switch (mode) {
			case 'hidden':
				this._setActorVisibility(indicator, false);
				break;
			case 'shown':
				if (indicator._indicator)
					this._setActorVisibility(indicator._indicator, true);
				this._setActorVisibility(indicator, true);
				break;
			case 'default':
				this._restoreIndicatorVisibility(indicator);
				break;
		}
	}

	_restoreIndicatorVisibility(indicator) {
		const indicatorActor = indicator._indicator;
		if (indicatorActor && this._naturalVisibility.has(indicatorActor))
			this._setActorVisibility(
				indicatorActor, this._naturalVisibility.get(indicatorActor));

		this._syncIndicatorVisibility(indicator);
	}

	_syncIndicatorVisibility(indicator) {
		const hasVisibleChildren = indicator.get_children().some(child => child.visible);
		this._setActorVisibility(indicator, hasVisibleChildren);
	}

	_setActorVisibility(actor, visible) {
		if (actor.visible === visible)
			return;

		this._applyingVisibility.add(actor);
		try {
			actor.visible = visible;
		} finally {
			this._applyingVisibility.delete(actor);
		}
	}
}
