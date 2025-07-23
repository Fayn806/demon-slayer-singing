export async function waitAnimationEnd(animator: Animator, animationId: string): Promise<void> {
	return new Promise(resolve => {
		const animation = new Instance("Animation", animator);
		animation.AnimationId = animationId;
		let animationTrack = animator.LoadAnimation(animation);

		let escaped = 0;
		while (animationTrack.Length <= 0) {
			// 等待动画长度大于0
			animationTrack = animator.LoadAnimation(animation);
			if (escaped > 3) {
				warn("Animation length still not set after 10 attempts, giving up.");
				break;
			}

			wait(0.1);
			escaped += 0.1;
		}

		const connection = animationTrack.Stopped.Once(() => {
			task.cancel(task1);
			resolve();
		});
		const task1 = task.delay(animationTrack.Length + 0.1, () => {
			if (animationTrack.IsPlaying) {
				animationTrack.Stop();
			}

			connection.Disconnect();
			resolve();
		});
		animationTrack.Play();
	});
}
