/** Utility functions for working with Roblox instances. */

/**
 * Wait for a child instance to be added to a parent.
 *
 * @template T - The expected instance type.
 * @param parent - The parent instance to monitor.
 * @param childName - The name of the child to wait for.
 * @param timeout - Optional timeout in seconds (default: 10).
 * @returns Promise that resolves with the child instance.
 */
export async function waitForChild<T extends Instance = Instance>(
	parent: Instance,
	childName: string,
	timeout = 10,
): Promise<T> {
	return new Promise((resolve, reject) => {
		// Check if child already exists
		const existingChild = parent.FindFirstChild(childName) as T | undefined;
		if (existingChild) {
			resolve(existingChild);
			return;
		}

		// Set up timeout using spawn
		let timedOut = false;
		task.spawn(() => {
			task.wait(timeout);
			if (!timedOut) {
				timedOut = true;
				connection?.Disconnect();
				// eslint-disable-next-line ts/prefer-promise-reject-errors -- Roblox uses string errors
				reject(`Timeout waiting for child '${childName}' in '${parent.GetFullName()}'`);
			}
		});

		// Listen for child added
		let connection: RBXScriptConnection | undefined;
		connection = parent.ChildAdded.Connect(child => {
			if (child.Name !== childName || timedOut) {
				return;
			}

			timedOut = true;
			connection?.Disconnect();
			resolve(child as T);
		});
	});
}

/**
 * Wait for multiple child instances to be added to a parent.
 *
 * @template T - The expected instance type.
 * @param parent - The parent instance to monitor.
 * @param childNames - Array of child names to wait for.
 * @param timeout - Optional timeout in seconds (default: 10).
 * @returns Promise that resolves with an array of child instances.
 */
export async function waitForChildren<T extends Instance = Instance>(
	parent: Instance,
	childNames: Array<string>,
	timeout = 10,
): Promise<Array<T>> {
	const results: Array<T> = [];
	for (const name of childNames) {
		const child = await waitForChild<T>(parent, name, timeout);
		results.push(child);
	}

	return results;
}

/**
 * Wait for an instance to have a specific attribute.
 *
 * @template T - The expected attribute value type.
 * @param instance - The instance to monitor.
 * @param attributeName - The name of the attribute to wait for.
 * @param timeout - Optional timeout in seconds (default: 10).
 * @returns Promise that resolves when the attribute is set.
 */
export async function waitForAttribute<T = unknown>(
	instance: Instance,
	attributeName: string,
	timeout = 10,
): Promise<T> {
	return new Promise((resolve, reject) => {
		// Check if attribute already exists
		const existingValue = instance.GetAttribute(attributeName) as T | undefined;
		if (existingValue !== undefined) {
			resolve(existingValue);
			return;
		}

		// Set up timeout using spawn
		let timedOut = false;
		task.spawn(() => {
			task.wait(timeout);
			if (!timedOut) {
				timedOut = true;
				connection?.Disconnect();
				// eslint-disable-next-line ts/prefer-promise-reject-errors -- Roblox uses string errors
				reject(
					`Timeout waiting for attribute '${attributeName}' on '${instance.GetFullName()}'`,
				);
			}
		});

		// Listen for attribute changes
		let connection: RBXScriptConnection | undefined;
		connection = instance.AttributeChanged.Connect(name => {
			if (name !== attributeName || timedOut) {
				return;
			}

			const value = instance.GetAttribute(attributeName) as T;
			if (value !== undefined) {
				timedOut = true;
				connection?.Disconnect();
				resolve(value);
			}
		});
	});
}

/**
 * Wait for an instance to be loaded (have all required children and
 * attributes).
 *
 * @param instance - The instance to check.
 * @param requiredChildren - Array of required child names.
 * @param requiredAttributes - Array of required attribute names.
 * @param timeout - Optional timeout in seconds (default: 10).
 * @returns Promise that resolves when the instance is fully loaded.
 */
export async function waitForInstanceLoaded(
	instance: Instance,
	requiredChildren: Array<string> = [],
	requiredAttributes: Array<string> = [],
	timeout = 10,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const checkLoaded = (): boolean => {
			// Check children
			for (const childName of requiredChildren) {
				if (!instance.FindFirstChild(childName)) {
					return false;
				}
			}

			// Check attributes
			for (const attributeName of requiredAttributes) {
				if (instance.GetAttribute(attributeName) === undefined) {
					return false;
				}
			}

			return true;
		};

		// Check if already loaded
		if (checkLoaded()) {
			resolve();
			return;
		}

		// Set up timeout using spawn
		let timedOut = false;
		task.spawn(() => {
			task.wait(timeout);
			if (!timedOut) {
				timedOut = true;
				childConnection?.Disconnect();
				attributeConnection?.Disconnect();
				// eslint-disable-next-line ts/prefer-promise-reject-errors -- Roblox uses string errors
				reject(`Timeout waiting for instance '${instance.GetFullName()}' to load`);
			}
		});

		// Listen for changes
		let childConnection: RBXScriptConnection | undefined;
		let attributeConnection: RBXScriptConnection | undefined;

		const onUpdate = (): void => {
			if (!checkLoaded() || timedOut) {
				return;
			}

			timedOut = true;
			childConnection?.Disconnect();
			attributeConnection?.Disconnect();
			resolve();
		};

		if (requiredChildren.size() > 0) {
			childConnection = instance.ChildAdded.Connect(onUpdate);
		}

		if (requiredAttributes.size() > 0) {
			attributeConnection = instance.AttributeChanged.Connect(onUpdate);
		}
	});
}

/**
 * Safely get a child instance with type checking.
 *
 * @param parent - The parent instance.
 * @param childName - The name of the child.
 * @param expectedClassName - Optional expected class name for type checking.
 * @returns The child instance or undefined if not found/wrong type.
 */
export function safeGetChild(
	parent: Instance,
	childName: string,
	expectedClassName?: keyof CreatableInstances,
): Instance | undefined {
	const child = parent.FindFirstChild(childName);
	if (!child) {
		return undefined;
	}

	if (expectedClassName && !child.IsA(expectedClassName)) {
		warn(
			`Child '${childName}' exists but is not a ${expectedClassName}, got ${child.ClassName}`,
		);
		return undefined;
	}

	return child;
}

/**
 * Create or get a child instance.
 *
 * @template T - The class name type.
 * @param parent - The parent instance.
 * @param childName - The name of the child.
 * @param className - The class name to create if child doesn't exist.
 * @returns The existing or newly created child instance.
 */
export function getOrCreateChild<T extends keyof CreatableInstances>(
	parent: Instance,
	childName: string,
	className: T,
): CreatableInstances[T] {
	let child = parent.FindFirstChild(childName) as CreatableInstances[T] | undefined;

	if (!child) {
		child = new Instance(className);
		child.Name = childName;
		child.Parent = parent;
	} else if (!child.IsA(className)) {
		warn(`Child '${childName}' exists but is not a ${className}, got ${child.ClassName}`);
		// Create new instance with different name
		child = new Instance(className);
		child.Name = childName;
		child.Parent = parent;
	}

	return child;
}
