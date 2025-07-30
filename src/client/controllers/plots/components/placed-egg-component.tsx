import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import React from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { ReplicatedStorage, Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { RemProvider } from "client/ui/providers/rem-provider";
import { HatchingGui } from "client/ui/screens/item/hatching-gui";
import { $NODE_ENV } from "rbxts-transform-env";
import { remotes } from "shared/remotes";
import { selectPlacedItemById } from "shared/store/players/selectors";
import type { PlacedEgg } from "shared/types";
import { Tag } from "types/enum/tag";
import type { PlacedEggAttributes, PlacedEggModel } from "types/interfaces/components/placed-egg";

import type { PlotComponent } from "./plot-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.PlacedEgg,
})
export class PlacedEggComponent extends BaseComponent<PlacedEggAttributes, PlacedEggModel> {
	private readonly guiRoot;
	private readonly janitor = new Janitor();

	private hatchingPromise?: Promise<number>;
	private plotComponent: PlotComponent | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {
		super();
		this.guiRoot = createRoot(new Instance("Folder"));
		this.instance.Billboard.Destroy();
	}

	public initialize(plotComponent: PlotComponent): void {
		this.plotComponent = plotComponent;

		// 监听状态变化
		// this.setupStateListener();

		// 设置放置蛋的UI
		this.setupHatchingState();
	}

	/** @ignore */
	public destroy(): void {
		if (this.hatchingPromise) {
			this.hatchingPromise.cancel();
			this.hatchingPromise = undefined;
		}

		this.guiRoot.unmount();
		this.instance.Destroy();

		this.logger.Verbose(`PlacedEgg ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}

	private setupHatchingState(): void {
		if (this.attributes.playerId !== USER_ID) {
			return;
		}

		// 这里可以添加放置蛋孵化的逻辑
		const placedEgg = this.store.getState(
			selectPlacedItemById(this.attributes.playerId, this.attributes.instanceId),
		) as PlacedEgg | undefined;
		if (!placedEgg) {
			this.guiRoot.unmount();
			return;
		}

		const { hatchLeftTime, placedTime } = placedEgg;
		const currentTime = Workspace.GetServerTimeNow();
		const leftTime = placedTime + hatchLeftTime - currentTime;

		this.guiRoot.render(
			createPortal(
				<RemProvider key="rem-provider">
					<HatchingGui
						leftTime={placedTime + hatchLeftTime - currentTime}
						maxTime={hatchLeftTime}
					/>
				</RemProvider>,
				this.instance,
			),
		);

		// 等待孵化
		this.hatchingPromise = Promise.delay(leftTime);
		this.hatchingPromise
			.andThen(() => {
				this.logger.Info(`Egg ${this.attributes.instanceId} has hatched.`);
				this.guiRoot.unmount();
				// 这里可以添加孵化完成后的逻辑，比如更新状态或通知玩家
				this.createHatchInteraction();
			})
			.catch(err => {
				this.logger.Error(`Error while hatching egg ${this.attributes.instanceId}: ${err}`);
				this.guiRoot.unmount();
			});
	}

	private createHatchInteraction(): void {
		const proximityPrompt = new Instance("ProximityPrompt");
		proximityPrompt.ActionText = "Hatch";
		proximityPrompt.RequiresLineOfSight = false;
		proximityPrompt.HoldDuration = 0.15;
		proximityPrompt.MaxActivationDistance = 10;
		proximityPrompt.Parent = this.instance;

		Promise.fromEvent(proximityPrompt.Triggered)
			.andThen(() => {
				proximityPrompt.Enabled = false;
				this.logger.Info(`Hatching egg ${this.attributes.instanceId}...`);
				// 这里可以添加孵化逻辑，比如生成小鸡或其他物品
				remotes.plot.hatchEgg
					.request(this.attributes.instanceId)
					.andThen(result => {
						if (result !== undefined && result) {
							this.logger.Info(
								`Egg ${this.attributes.instanceId} hatched successfully.`,
							);
							this.playHatchingAnimation()
								.andThen(() => {
									this.logger.Info(
										`Hatching animation completed for egg ${this.attributes.instanceId}`,
									);
									remotes.plot.hatchEggComplete
										.request(this.attributes.instanceId)
										.andThen(completed => {
											if (completed !== undefined && completed) {
												this.logger.Info(
													`Hatch complete request sent for egg ${this.attributes.instanceId}`,
												);
											} else {
												this.logger.Warn(
													`Failed to complete hatch for egg ${this.attributes.instanceId}`,
												);
												proximityPrompt.Enabled = true;
											}
										})
										.catch(err => {
											this.logger.Error(
												`Error while completing hatch for egg ${this.attributes.instanceId}: ${err}`,
											);
										});
								})
								.catch(err => {
									this.logger.Error(
										`Error while playing hatching animation: ${err}`,
									);
								});
						} else {
							this.logger.Warn(`Failed to hatch egg ${this.attributes.instanceId}.`);
						}
					})
					.catch(err => {
						this.logger.Error(
							`Error while hatching egg ${this.attributes.instanceId}: ${err}`,
						);
					});
			})
			.catch(err => {
				this.logger.Error(`Error while hatching egg ${this.attributes.instanceId}: ${err}`);
			});
	}

	private async playHatchingAnimation(): Promise<void> {
		return new Promise<void>(resolve => {
			this.instance.Egg.LocalTransparencyModifier = 1;
			// 配置参数
			const animationDuration = 3;
			const minSwitchInterval = 0.05;
			const maxSwitchInterval = 0.5;

			// 获取所有可用的角色模型
			const assetsFolder = ReplicatedStorage.WaitForChild("Assets") as Folder;
			const charactersFolder = assetsFolder.WaitForChild("Characters") as Folder;

			if (!charactersFolder.IsA("Folder")) {
				this.logger.Warn("Characters folder not found in ReplicatedStorage.Assets");
				error("Characters folder not found");
			}

			// 外部提供的角色ID列表
			const characterIds: Array<string> = [
				"StarterCharacter_1",
				"StarterCharacter_2",
				"StarterCharacter_3",
				"StarterCharacter_4",
				"StarterCharacter_5",
				"StarterCharacter_6",
				"StarterCharacter_7",
				"StarterCharacter_8",
				"StarterCharacter_9",
				"StarterCharacter_10",
			];

			// 保存原始位置和方向
			const originalCFrame = this.instance.GetPivot();

			let currentModel: Model | undefined;
			let animationRunning = true;

			// 动画开始时间
			const startTime = tick();

			/** 切换模型的函数. */
			const switchModel = (): void => {
				if (!animationRunning) {
					return;
				}

				const elapsedTime = tick() - startTime;

				// 如果动画时间结束
				if (elapsedTime >= animationDuration) {
					animationRunning = false;

					// 移除当前模型
					if (currentModel) {
						currentModel.Destroy();
					}

					// 播放粒子特效
					this.playHatchEffect(originalCFrame.Position);

					// 解析 Promise
					resolve();
					return;
				}

				// 移除当前模型
				if (currentModel) {
					currentModel.Destroy();
				}

				// 随机选择一个角色ID
				const randomIndex = math.random(0, characterIds.size() - 1);
				const selectedCharacterId = characterIds[randomIndex];

				if (selectedCharacterId === undefined) {
					this.logger.Warn(
						"Selected character ID is undefined, skipping animation step.",
					);
					return;
				}

				// 尝试找到对应的模型
				const selectedModel = charactersFolder.FindFirstChild(selectedCharacterId);
				if (!selectedModel?.IsA("Model")) {
					this.logger.Warn(
						`Character model ${selectedCharacterId} not found in Characters folder or is not a Model.`,
					);
					// 继续下一次切换而不是停止动画
					const progress = elapsedTime / animationDuration;
					const currentInterval =
						minSwitchInterval + (maxSwitchInterval - minSwitchInterval) * progress;

					task.spawn(() => {
						task.wait(currentInterval);
						switchModel();
					});
					return;
				}

				// 创建 Highlight 效果
				const highlight = new Instance("Highlight");
				highlight.FillColor = Color3.fromRGB(0, 0, 0);
				highlight.FillTransparency = 0;
				highlight.OutlineTransparency = 1;

				// 克隆模型
				const clonedModel = selectedModel.Clone();
				currentModel = clonedModel;

				const humanoidRootPart = clonedModel.WaitForChild("HumanoidRootPart", 3) as
					| BasePart
					| undefined;
				const humanoid = clonedModel.WaitForChild("Humanoid", 3) as Humanoid | undefined;
				// 设置位置和父级
				const yOffset =
					(humanoidRootPart !== undefined ? humanoidRootPart.Size.Y / 2 : 0) +
					(humanoid ? humanoid.HipHeight : 0);
				clonedModel.PivotTo(originalCFrame.mul(new CFrame(0, yOffset, 0)));
				clonedModel.Parent = this.instance.Parent;

				if (humanoidRootPart) {
					humanoidRootPart.Anchored = true;
				}

				// 添加 highlight 效果
				highlight.Parent = clonedModel;

				// 计算当前切换间隔（从快到慢）
				const progress = elapsedTime / animationDuration;
				const currentInterval =
					minSwitchInterval + (maxSwitchInterval - minSwitchInterval) * progress;

				// 设置下一次切换的定时器
				task.spawn(() => {
					task.wait(currentInterval);
					switchModel();
				});
			};

			// 开始第一次切换
			switchModel();
		});
	}

	/**
	 * 播放孵化完成的粒子特效.
	 *
	 * @param position - 特效播放位置.
	 */
	private playHatchEffect(position: Vector3): void {
		// 创建一个临时的 Part 用于放置粒子特效
		const effectPart = new Instance("Part");
		effectPart.Name = "HatchEffect";
		effectPart.Size = new Vector3(1, 1, 1);
		effectPart.Position = position;
		effectPart.Anchored = true;
		effectPart.CanCollide = false;
		effectPart.Transparency = 1;
		effectPart.Parent = Workspace;

		// 创建粒子发射器
		const attachment = new Instance("Attachment");
		attachment.Parent = effectPart;

		const particleEmitter = new Instance("ParticleEmitter");
		particleEmitter.Parent = attachment;

		// 配置粒子特效
		particleEmitter.Color = new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(255, 215, 0)),
			new ColorSequenceKeypoint(0.5, Color3.fromRGB(255, 255, 255)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(255, 215, 0)),
		]);
		particleEmitter.Size = new NumberSequence([
			new NumberSequenceKeypoint(0, 0.1),
			new NumberSequenceKeypoint(0.5, 1),
			new NumberSequenceKeypoint(1, 0.1),
		]);
		particleEmitter.Lifetime = new NumberRange(1, 2);
		particleEmitter.Rate = 100;
		particleEmitter.SpreadAngle = new Vector2(45, 45);
		particleEmitter.Speed = new NumberRange(5, 15);
		particleEmitter.VelocityInheritance = 0;

		// 发射粒子
		particleEmitter.Emit(50);

		// 2秒后清理特效
		task.spawn(() => {
			task.wait(2);
			effectPart.Destroy();
		});
	}

	/** 设置状态监听器. */
	private setupStateListener(): void {
		this.janitor.Add(
			this.store.subscribe(
				selectPlacedItemById(this.attributes.playerId, this.attributes.instanceId),
				placedItem => {
					if (!placedItem) {
						this.instance.Destroy();
						return;
					}

					this.logger.Info(
						`Placed item ${this.attributes.instanceId} found for player ${this.attributes.playerId}.`,
					);
				},
			),
		);
	}
}
