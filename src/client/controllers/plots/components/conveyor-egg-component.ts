import type { Components } from "@flamework/components";
import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import { RunService, TweenService } from "@rbxts/services";

import type { RootStore } from "client/store";
import { $NODE_ENV } from "rbxts-transform-env";
import { selectConveyorEggById } from "shared/store/players/selectors";
import { calculateEggProgress } from "shared/util/egg-util";
import { Tag } from "types/enum/tag";

import type { EggAttributes, EggModel } from "../../../../types/interfaces/components/egg";
import type { PlotComponent } from "./plot-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Egg,
})
export class ConveyorEggComponent extends BaseComponent<EggAttributes, EggModel> {
	private readonly janitor = new Janitor();

	private effectConnections: Array<RBXScriptConnection> = [];
	private lastWorldPosition: CFrame | undefined;
	private movementConnection: RBXScriptConnection | undefined;
	private plotComponent: PlotComponent | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly components: Components,
	) {
		super();
	}

	public initialize(plotComponent: PlotComponent): void {
		this.plotComponent = plotComponent;

		this.logger.Info(`Egg component started for ${this.instance.GetFullName()}`);

		// 设置点击事件
		this.setupInteraction();

		// 设置传送带移动
		this.setupConveyorMovement();

		// 设置蛋的特效
		this.setupEggEffects();

		// 监听状态变化
		this.setupStateListener();
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`Egg ${this.instance.GetFullName()} has been destroyed.`);

		// 停止蛋移动
		if (this.movementConnection) {
			this.movementConnection.Disconnect();
			this.movementConnection = undefined;
		}

		// 重置位置记录
		this.lastWorldPosition = undefined;

		// 停止所有特效
		for (const connection of this.effectConnections) {
			connection.Disconnect();
		}

		this.effectConnections = [];

		this.instance.Destroy();

		this.janitor.Destroy();
		super.destroy();
	}

	/** 设置交互处理. */
	private setupInteraction(): void {
		const proximityPrompt = new Instance("ProximityPrompt");
		proximityPrompt.ActionText = "Buy Egg";
		proximityPrompt.Parent = this.instance;
		proximityPrompt.MaxActivationDistance = 15;
		proximityPrompt.HoldDuration = 0.15;
		proximityPrompt.RequiresLineOfSight = false;

		proximityPrompt.Triggered.Connect(() => {
			this.handleEggClick();
		});

		this.janitor.Add(proximityPrompt);
	}

	/** 处理蛋被点击. */
	private handleEggClick(): void {
		const { instanceId } = this.attributes;

		this.logger.Info(`Player clicked on conveyor egg: ${instanceId}`);

		// 播放点击特效
		this.playClickEffect();

		// 发送远程事件到服务器处理蛋的收集逻辑
		this.collectEgg();
	}

	/** 收集蛋. */
	private collectEgg(): void {
		// 这里应该发送远程事件到服务器
		this.logger.Info(`Collecting egg ${this.attributes.instanceId}`);
	}

	/** 播放点击特效. */
	private playClickEffect(): void {
		// 缩放动画
		const originalSize = this.instance.Egg.Size;
		const targetSize = originalSize.mul(1.2);

		const scaleTween = TweenService.Create(
			this.instance.Egg,
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out, 0, true),
			{ Size: targetSize },
		);

		scaleTween.Play();
		this.janitor.Add(scaleTween);

		// 发光效果
		const pointLight = new Instance("PointLight");
		pointLight.Color = Color3.fromRGB(255, 215, 0);
		pointLight.Brightness = 2;
		pointLight.Range = 10;
		pointLight.Parent = this.instance.Egg;

		const lightTween = TweenService.Create(
			pointLight,
			new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{ Brightness: 0 },
		);

		lightTween.Completed.Connect(() => {
			pointLight.Destroy();
		});
		lightTween.Play();
	}

	private getEggCurrentProgress(): number {
		const egg = this.store.getState(
			selectConveyorEggById(this.attributes.playerId, this.attributes.instanceId),
		);
		if (!egg) {
			this.logger.Warn(
				`Egg with instance ID ${this.attributes.instanceId} not found in state.`,
			);
			return 0;
		}

		const speedHistory = this.plotComponent?.getConveyorSpeedHistory() ?? [];

		// 获取当前蛋的位置
		return calculateEggProgress(egg.moveStartTime, undefined, speedHistory);
	}

	private getEggWorldPosition(startPosition: CFrame, endPosition: CFrame): CFrame {
		const progress = this.getEggCurrentProgress();
		// 计算世界坐标
		return startPosition.Lerp(endPosition, progress);
	}

	/** 设置传送带移动. */
	private setupConveyorMovement(): void {
		// 传送带移动逻辑将在后续实现
		// 1. 从传送带一端移动到另一端
		// 2. 根据 moveStartTime 计算当前应该在的位置
		// 3. 使用 TweenService 实现平滑移动

		this.logger.Verbose(`Setting up conveyor movement for egg ${this.attributes.instanceId}`);
		const startPosition = this.plotComponent?.getEggMoveStartPosition();
		const endPosition = this.plotComponent?.getEggMoveEndPosition();
		if (!startPosition || !endPosition) {
			this.logger.Warn("Egg move start or end position is not defined.");
			return;
		}

		// 使用平滑移动
		this.movementConnection = RunService.Heartbeat.Connect(deltaTime => {
			const targetPosition = this.getEggWorldPosition(startPosition, endPosition);

			if (!this.lastWorldPosition) {
				/** 首次设置位置. */
				this.lastWorldPosition = targetPosition;
				this.instance.PivotTo(targetPosition);
			} else {
				/** 使用插值平滑移动，值越大移动越快. */
				const lerpFactor = math.min(deltaTime * 15, 1);
				this.lastWorldPosition = this.lastWorldPosition.Lerp(targetPosition, lerpFactor);
				this.instance.PivotTo(this.lastWorldPosition);
			}
		});
	}

	/** 设置蛋的特效. */
	private setupEggEffects(): void {
		this.logger.Verbose(`Setting up egg effects for ${this.attributes.instanceId}`);

		// 1. 旋转特效
		this.setupRotationEffect();

		// 2. 发光特效
		this.setupGlowEffect();

		// 3. 漂浮特效
		this.setupFloatingEffect();

		// 4. 粒子特效
		this.setupParticleEffects();
	}

	/** 设置旋转特效. */
	private setupRotationEffect(): void {
		let rotationAngle = 0;

		const rotationConnection = RunService.Heartbeat.Connect(deltaTime => {
			/** 每秒旋转45度. */
			rotationAngle += deltaTime * 45;
			this.instance.Egg.Rotation = new Vector3(0, rotationAngle, 0);
		});

		this.effectConnections.push(rotationConnection);
		this.janitor.Add(rotationConnection);
	}

	/** 设置发光特效. */
	private setupGlowEffect(): void {
		// 添加环境光效果
		const pointLight = new Instance("PointLight");
		pointLight.Color = Color3.fromRGB(255, 255, 200);
		pointLight.Brightness = 0.5;
		pointLight.Range = 5;
		pointLight.Parent = this.instance.Egg;

		// 呼吸光效果
		let time = 0;
		const breathingConnection = RunService.Heartbeat.Connect(deltaTime => {
			time += deltaTime;
			/** 0.1 到 0.5 之间变化. */
			const brightness = 0.3 + math.sin(time * 2) * 0.2;
			pointLight.Brightness = brightness;
		});

		this.effectConnections.push(breathingConnection);
		this.janitor.Add(breathingConnection);
		this.janitor.Add(pointLight);
	}

	/** 设置漂浮特效. */
	private setupFloatingEffect(): void {
		let time = 0;
		const originalCFrame = this.instance.PrimaryPart.CFrame;

		const floatingConnection = RunService.Heartbeat.Connect(deltaTime => {
			time += deltaTime;
			/** 上下浮动0.2 studs. */
			const yOffset = math.sin(time * 3) * 0.2;
			const newPosition = originalCFrame.Position.add(new Vector3(0, yOffset, 0));
			this.instance.PrimaryPart.CFrame = new CFrame(newPosition).mul(
				originalCFrame.sub(originalCFrame.Position),
			);
		});

		this.effectConnections.push(floatingConnection);
		this.janitor.Add(floatingConnection);
	}

	/** 设置粒子特效. */
	private setupParticleEffects(): void {
		// 添加闪烁粒子效果
		const attachment = new Instance("Attachment");
		attachment.Parent = this.instance.Egg;

		const sparkles = new Instance("Sparkles");
		sparkles.Color = Color3.fromRGB(255, 215, 0);
		sparkles.SparkleColor = Color3.fromRGB(255, 255, 255);
		sparkles.Parent = this.instance.Egg;

		this.janitor.Add(attachment);
		this.janitor.Add(sparkles);
	}

	/** 监听蛋状态变化. */
	private setupStateListener(): void {
		// 监听store状态变化
		const unsubscribe = this.store.subscribe(
			selectConveyorEggById(this.attributes.playerId, this.attributes.instanceId),
			conveyorEgg => {
				if (!conveyorEgg) {
					this.logger.Info(
						`Egg ${this.attributes.instanceId} no longer exists in state, destroying component`,
					);
					this.destroy();
				} else {
					this.logger.Info(
						`Egg ${this.attributes.instanceId} state updated: ${conveyorEgg}`,
					);
				}
			},
		);

		this.janitor.Add(unsubscribe);
	}
}
