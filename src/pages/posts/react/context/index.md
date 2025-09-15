---
title: 'React Context'
date: '2025-09-14'
duration: 10min
lang: zh
---

## React Context

### ContextProvider

在 `fiber` 的 `beginWork()` 阶段，对于 `ContextProvider` 组件

```typescript
case ContextProvider:
  return updateContextProvider(current, workInProgress, renderLanes);
```

在 `updateContextProvider` 中，

1. 会执行 `pushProvider()` 把上一次的值放到 `valueCursor` 上，记录历史值到 `valueStack`。
2. 如果 `context` 的值变化了，要执行 `propagateContextChange()` 找依赖这个 `context` 的组件，强制更新。

```typescript
function updateContextProvider(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  const providerType: ReactProviderType<any> = workInProgress.type;
  const context: ReactContext<any> = providerType._context;

  const newProps = workInProgress.pendingProps;
  const oldProps = workInProgress.memoizedProps;

  const newValue = newProps.value;

  // 把上一次的值放到 valueCursor 上，记录历史值到 valueStack
  pushProvider(workInProgress, context, newValue);

  if (enableLazyContextPropagation) {
    // In the lazy propagation implementation, we don't scan for matching
    // consumers until something bails out, because until something bails out
    // we're going to visit those nodes, anyway. The trade-off is that it shifts
    // responsibility to the consumer to track whether something has changed.
  } else {
    // 不是挂载阶段
    if (oldProps !== null) {
      const oldValue = oldProps.value;

      if (is(oldValue, newValue)) {
        // 没有改变
        // No change. Bailout early if children are the same.
        if (
          oldProps.children === newProps.children &&
          !hasLegacyContextChanged()
        ) {
          return bailoutOnAlreadyFinishedWork(
            current,
            workInProgress,
            renderLanes
          );
        }
      } else {
        // 值变化了
        // The context value changed. Search for matching consumers and schedule
        // them to update.
        propagateContextChange(workInProgress, context, renderLanes);
      }
    }
  }

  const newChildren = newProps.children;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
```

在 `pushProvider()` 中，做了两件事：

1. 把上一次的值放到 `valueCursor` 上，记录历史值到 `valueStack`。
2. 更新 `context` 的值，即 `context._currentValue`。

```typescript
export function pushProvider<T>(
  providerFiber: Fiber,
  context: ReactContext<T>,
  nextValue: T
): void {
  if (isPrimaryRenderer) {
    push(valueCursor, context._currentValue, providerFiber);
    context._currentValue = nextValue;
  } else {
    push(valueCursor, context._currentValue2, providerFiber);
    context._currentValue2 = nextValue;
  }
}
```

<a href="/posts/react/context/valueCursor">详解 valueCursor</a>

在 `propagateContextChange()` 中，主要做的事情就是遍历 `Provider` 包裹的所有子 `fiber`，如果发现有依赖 `context` 的值，就将节点标记为更新，并在 `scheduleContextWorkOnParentPath()` 方法中将更新标记冒泡到父 `fiber`，最后触发调度更新。

```typescript
export function propagateContextChange<T>(
  workInProgress: Fiber,
  context: ReactContext<T>,
  renderLanes: Lanes,
): void {
  if (enableLazyContextPropagation) {
    // TODO: This path is only used by Cache components. Update
    // lazilyPropagateParentContextChanges to look for Cache components so they
    // can take advantage of lazy propagation.
    const forcePropagateEntireTree = true;
    propagateContextChanges(
      workInProgress,
      [context],
      renderLanes,
      forcePropagateEntireTree,
    );
  } else {
    propagateContextChange_eager(workInProgress, context, renderLanes);
  }
}

function propagateContextChange_eager<T>(
  workInProgress: Fiber,
  context: ReactContext<T>,
  renderLanes: Lanes,
): void {
  // Only used by eager implementation
  if (enableLazyContextPropagation) {
    return;
  }
  let fiber = workInProgress.child;
  if (fiber !== null) {
    // Set the return pointer of the child to the work-in-progress fiber.
    fiber.return = workInProgress;
  }
  while (fiber !== null) {
    let nextFiber;

    // Visit this fiber.
    const list = fiber.dependencies;
    if (list !== null) {
      nextFiber = fiber.child;

      let dependency = list.firstContext;
      while (dependency !== null) {
        // Check if the context matches.
        if (dependency.context === context) {
          // Match! Schedule an update on this fiber.
          if (fiber.tag === ClassComponent) {
            // Schedule a force update on the work-in-progress.
            const lane = pickArbitraryLane(renderLanes);
            const update = createUpdate(NoTimestamp, lane);
            update.tag = ForceUpdate;
            // TODO: Because we don't have a work-in-progress, this will add the
            // update to the current fiber, too, which means it will persist even if
            // this render is thrown away. Since it's a race condition, not sure it's
            // worth fixing.

            // Inlined `enqueueUpdate` to remove interleaved update check
            const updateQueue = fiber.updateQueue;
            if (updateQueue === null) {
              // Only occurs if the fiber has been unmounted.
            } else {
              const sharedQueue: SharedQueue<any> = (updateQueue: any).shared;
              const pending = sharedQueue.pending;
              if (pending === null) {
                // This is the first update. Create a circular list.
                update.next = update;
              } else {
                update.next = pending.next;
                pending.next = update;
              }
              sharedQueue.pending = update;
            }
          }

          fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
          const alternate = fiber.alternate;
          if (alternate !== null) {
            alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
          }
          scheduleContextWorkOnParentPath(
            fiber.return,
            renderLanes,
            workInProgress,
          );

          // Mark the updated lanes on the list, too.
          list.lanes = mergeLanes(list.lanes, renderLanes);

          // Since we already found a match, we can stop traversing the
          // dependency list.
          break;
        }
        dependency = dependency.next;
      }
    } else if (fiber.tag === ContextProvider) {
      // Don't scan deeper if this is a matching provider
      nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
    } else if (fiber.tag === DehydratedFragment) {
      // If a dehydrated suspense boundary is in this subtree, we don't know
      // if it will have any context consumers in it. The best we can do is
      // mark it as having updates.
      const parentSuspense = fiber.return;

      if (parentSuspense === null) {
        throw new Error(
          'We just came from a parent so we must have had a parent. This is a bug in React.',
        );
      }

      parentSuspense.lanes = mergeLanes(parentSuspense.lanes, renderLanes);
      const alternate = parentSuspense.alternate;
      if (alternate !== null) {
        alternate.lanes = mergeLanes(alternate.lanes, renderLanes);
      }
      // This is intentionally passing this fiber as the parent
      // because we want to schedule this fiber as having work
      // on its children. We'll use the childLanes on
      // this fiber to indicate that a context has changed.
      scheduleContextWorkOnParentPath(
        parentSuspense,
        renderLanes,
        workInProgress,
      );
      nextFiber = fiber.sibling;
    } else {
      // Traverse down.
      nextFiber = fiber.child;
    }

    if (nextFiber !== null) {
      // Set the return pointer of the child to the work-in-progress fiber.
      nextFiber.return = fiber;
    } else {
      // No child. Traverse to next sibling.
      nextFiber = fiber;
      while (nextFiber !== null) {
        if (nextFiber === workInProgress) {
          // We're back to the root of this subtree. Exit.
          nextFiber = null;
          break;
        }
        const sibling = nextFiber.sibling;
        if (sibling !== null) {
          // Set the return pointer of the sibling to the work-in-progress fiber.
          sibling.return = nextFiber.return;
          nextFiber = sibling;
          break;
        }
        // No more siblings. Traverse up.
        nextFiber = nextFiber.return;
      }
    }
    fiber = nextFiber;
  }
}
```

### `fiber` 上的 `dependencies` 是什么时候收集的呢？

1. 在执行 `useContext()` 方法时，在对应的 `fiber` 上会将 `dependencies` 链表上加上依赖的 `context`，并将 `context` 的值返回，即 `context._currentValue`。

```typescript
// 执行 useContext() 其实就是执行 readContext()
export function readContext<T>(context: ReactContext<T>): T {
  const value = isPrimaryRenderer
    ? context._currentValue
    : context._currentValue2;

  if (lastFullyObservedContext === context) {
    // Nothing to do. We already observe everything in this context.
  } else {
    const contextItem = {
      context: ((context: any): ReactContext<mixed>),
      memoizedValue: value,
      next: null,
    };

    // 处理 dependencies 链表
    if (lastContextDependency === null) {
      // This is the first dependency for this component. Create a new list.
      lastContextDependency = contextItem;
      currentlyRenderingFiber.dependencies = {
        lanes: NoLanes,
        firstContext: contextItem,
      };
      if (enableLazyContextPropagation) {
        currentlyRenderingFiber.flags |= NeedsPropagation;
      }
    } else {
      // Append a new context item.
      lastContextDependency = lastContextDependency.next = contextItem;
    }
  }
  return value;
}
```

2. 在 `context.Consumer` 组件执行 `beginWork()` 时，其实也执行了 `readContext()` 方法：

```typescript
case ContextConsumer:
  return updateContextConsumer(current, workInProgress, renderLanes);
```

```typescript
function updateContextConsumer(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  let context: ReactContext<any> = workInProgress.type;

  const newProps = workInProgress.pendingProps;
  const render = newProps.children;

  prepareToReadContext(workInProgress, renderLanes);
  const newValue = readContext(context);
  if (enableSchedulingProfiler) {
    markComponentRenderStarted(workInProgress);
  }
  let newChildren;
  newChildren = render(newValue);

  if (enableSchedulingProfiler) {
    markComponentRenderStopped();
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  reconcileChildren(current, workInProgress, newChildren, renderLanes);
  return workInProgress.child;
}
```

3. 在类组件中，如果有 `contextType` 属性指定了 `context`，也会执行 `readContext()`:

```typescript
// 在类组件的 beginWork() 方法中
const contextType = ctor.contextType;
if (typeof contextType === 'object' && contextType !== null) {
  instance.context = readContext(contextType);
}
```

<Footer />
