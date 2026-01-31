import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { upgradeScripts } from './upgrade'
import { setupActions } from './actions'
import { setupFeedbacks } from './feedbacks'
import { setupPresets } from './presets'
import { configFields, ModuleConfig } from './config'
import * as net from 'net'

export class TimecoreInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	client: net.Socket | null = null
	timecodeRegex = '/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]:[0-5][0-9]$/'

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.client = null
		this.checkConfig()

		this.initActions()
		this.initFeedbacks()
		this.initPresets()
	}

	checkConfig(): void {
		if (this.config.targetIp !== '') {
			if (this.client != null) {
				this.client.end()
				this.client = null
			}
			this.client = new net.Socket()
			this.client.connect(this.config.targetPort, this.config.targetIp, () => {
				this.updateStatus(InstanceStatus.Ok)
			})
			this.client.on('error', (error) => {
				this.updateStatus(InstanceStatus.ConnectionFailure)
				console.log('Error: ' + error)
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'IP address missing')
		}
	}

	async destroy(): Promise<void> {
		if (this.client != null) {
			this.client.end()
		}
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.checkConfig()
	}

	sendMessage(message: string): void {
		if (this.client != null) {
			this.client.write(message)
		}
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return configFields
	}

	initFeedbacks(): void {
		setupFeedbacks(this)
	}

	initActions(): void {
		setupActions(this)
	}

	initPresets(): void {
		setupPresets(this)
	}
}

runEntrypoint(TimecoreInstance, upgradeScripts)
