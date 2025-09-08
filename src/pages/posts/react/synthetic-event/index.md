---
title: 'React 合成事件'
date: '2025-09-06'
duration: 10min
lang: zh
---

### 合成事件

<Indent />`React` 合成事件（`SyntheticEvent`）就是 `React` 自己封装的一个事件对象，它在内部通过事件委托机制统一管理和分发浏览器事件，提供跨浏览器一致的 API。

### 事件委托

<Indent />`事件委托`利用`事件冒泡`，可以只使用一个事件处理程序来管理一种类型的事件。
使用事件委托，只要给所有元素共同的祖先节点添加一个事件处理程序，就可以解决问题。

`事件委托`的`优点`：

- `document` 对象随时可用，任何时候都可以给它添加事件处理程序(不用等待 `DOMContentLoaded` 或 `load` 事件)。这意味着只要页面渲染出可点击的元素，就可以无延迟地起作用。
- 节省花在设置页面事件处理程序上的时间。只指定一个事件处理程序既可以节省 `DOM` 引用，也可以节省时间。
- 减少整个页面所需的内存，提升整体性能。

<Indent />最适合使用事件委托的事件包括:`click`、`mousedown`、`mouseup`、`keydown` 和 `keypress`。 `mouseover` 和 `mouseout` 事件冒泡，但很难适当处理，且经常需要计算元素位置（ 因为 `mouseout` 会在光标从一个元素移动到它的一个后代节点以及移出元素之外时触发）。

### 在 React 中的合成事件

#### 注册事件阶段

`React` 在执行 `createRoot` 时，会将所有可委托事件委托到 `root` 上。

1、`listenToAllSupportedEvents()`:

在 `createRoot()` 入口函数中，进行事件的委托。也就是执行 `listenToAllSupportedEvents()` 函数:

```typescript
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;

    // 处理所有原生事件
    allNativeEvents.forEach((domEventName) => {
      // 因为 selectionchange 事件不会冒泡，所以需要将它挂到 document 上
      if (domEventName !== 'selectionchange') {
        // 能委托的事件挂载到冒泡阶段
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }
        // 不能委托的挂载到捕获阶段
        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });

    const ownerDocument =
      rootContainerElement.nodeType === DOCUMENT_NODE
        ? rootContainerElement
        : rootContainerElement.ownerDocument;

    // 处理 selectionchange 事件
    if (ownerDocument !== null) {
      if (!ownerDocument[listeningMarker]) {
        ownerDocument[listeningMarker] = true;
        listenToNativeEvent('selectionchange', false, ownerDocument);
      }
    }
  }
}
```

在该入口函数中：

- 首先判断了根元素（div#root）上是否已经挂载了事件处理函数，保证只挂载一次。
- 然后遍历所有原生函数，执行挂载，也就是 `listenToNativeEvent()` 函数。如果事件不可委托，那我们就挂载到捕获阶段，否则挂载到冒泡阶段。
- 对于 `selectionchange` 事件额外处理，因为该事件不会冒泡，所以挂载到 `Document` 上。

2、 `listenToNativeEvent()`:

对每个原生事件进行注册

```typescript
export function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget
): void {
  let eventSystemFlags = 0;
  // 如果是捕获阶段事件，加一个 Flag
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}
```

3、`addTrappedEventListener()`

创建原生事件触发后的回调函数，并且根据事件在捕获/冒泡阶段触发注册对应的 listener。

```typescript
function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
  isDeferredListenerForLegacyFBSupport?: boolean
) {
  // 创建事件触发后的回调函数
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );
  let isPassiveListener: void | boolean = undefined;
  // 如果浏览器支持 event 配置 passive option
  if (passiveBrowserEventsSupported) {
    if (
      domEventName === 'touchstart' ||
      domEventName === 'touchmove' ||
      domEventName === 'wheel'
    ) {
      isPassiveListener = true;
    }
  }

  // 下面就是执行 addEventListener
  let unsubscribeListener;
  // 捕获
  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener
      );
    } else {
      unsubscribeListener = addEventCaptureListener(
        targetContainer,
        domEventName,
        listener
      );
    }
  }
  // 冒泡
  else {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener
      );
    } else {
      unsubscribeListener = addEventBubbleListener(
        targetContainer,
        domEventName,
        listener
      );
    }
  }
}
```

4、`createEventListenerWrapperWithPriority()`

根据不同事件，拿到不同的优先级，也对应不同的 listener 处理函数，最后将处理函数返回。

```typescript
export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags
): Function {
  const eventPriority = getEventPriority(domEventName);

  let listenerWrapper;
  switch (eventPriority) {
    // 离散事件
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    // 连续事件
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    // 默认
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }

  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}
```

#### 派发阶段

在监听到对应的事件时，会触发对应的 `listener` 处理函数，即 `dispatchEvent()`

5、`dispatchDiscreteEvent()`、`dispatchContinuousEvent()`、`dispatchEvent()` 之间的区别

这三个方法最终都执行了 `dispatchEvent()`，只不过 `dispatchDiscreteEvent()` 和 `dispatchContinuousEvent()` 这两个方法做了一些额外的操作：

- 将 `ReactSharedInternals.T` 设置为 `null`
- 将 `ReactDOMSharedInternals.p` 设置为 `DiscreteEventPriority` / `ContinuousEventPriority`

执行完 `dispatchEvent()` 后，再将上面两个变量的值恢复。

```typescript
function dispatchDiscreteEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  const prevTransition = ReactSharedInternals.T;
  ReactSharedInternals.T = null;
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;
  }
}

function dispatchContinuousEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  container: EventTarget,
  nativeEvent: AnyNativeEvent
) {
  const prevTransition = ReactSharedInternals.T;
  ReactSharedInternals.T = null;
  const previousPriority = getCurrentUpdatePriority();
  try {
    setCurrentUpdatePriority(ContinuousEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactSharedInternals.T = prevTransition;
  }
}
```

6、`dispatchEvent()`

```typescript
export function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent
): void {
  // 找到有没有阻塞目标，如果没有就处理
  // 如果有阻塞的 SuspenseInstance 或 Container，就将事件放入队列重放
  let blockedOn = findInstanceBlockingEvent(nativeEvent);
  // 没有阻塞，直接派发事件
  if (blockedOn === null) {
    dispatchEventForPluginEventSystem(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      return_targetInst,
      targetContainer
    );
    clearIfContinuousEvent(domEventName, nativeEvent);
    return;
  }

  // domEventName = focusin | dragenter | mouseover | pointerover | gotpointercapture
  // 上面这些 domEvent 进入该分支
  if (
    queueIfContinuousEvent(
      blockedOn,
      domEventName,
      eventSystemFlags,
      targetContainer,
      nativeEvent
    )
  ) {
    nativeEvent.stopPropagation();
    return;
  }
  clearIfContinuousEvent(domEventName, nativeEvent);

  if (
    eventSystemFlags & IS_CAPTURE_PHASE &&
    isDiscreteEventThatRequiresHydration(domEventName)
  ) {
    while (blockedOn !== null) {
      const fiber = getInstanceFromNode(blockedOn);
      if (fiber !== null) {
        attemptSynchronousHydration(fiber);
      }
      const nextBlockedOn = findInstanceBlockingEvent(nativeEvent);
      if (nextBlockedOn === null) {
        dispatchEventForPluginEventSystem(
          domEventName,
          eventSystemFlags,
          nativeEvent,
          return_targetInst,
          targetContainer
        );
      }
      if (nextBlockedOn === blockedOn) {
        break;
      }
      blockedOn = nextBlockedOn;
    }
    if (blockedOn !== null) {
      nativeEvent.stopPropagation();
    }
    return;
  }

  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    null,
    targetContainer
  );
}
```

7. `dispatchEventsForPlugins()`

```typescript
function dispatchEventsForPlugins(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  targetContainer: EventTarget
): void {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue: DispatchQueue = [];

  // React 事件系统内部的事件提取器，它负责把浏览器原生事件（NativeEvent）转换成 React 的合成事件（SyntheticEvent），并把它们放到 dispatchQueue 中，等待分发给组件。
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}
```

8. `extractEvents()`

创建对应的 `event`，然后 `accumulateSinglePhaseListeners()` 计算要执行的函数，都放到 `dispatchQueue` 中。

```typescript
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
  const reactName = topLevelEventsToReactNames.get(domEventName);
  if (reactName === undefined) {
    return;
  }
  let SyntheticEventCtor = SyntheticEvent;
  let reactEventType: string = domEventName;
  switch (domEventName) {
    case 'keypress':
      if (getEventCharCode(((nativeEvent: any): KeyboardEvent)) === 0) {
        return;
      }
    case 'keydown':
    case 'keyup':
      SyntheticEventCtor = SyntheticKeyboardEvent;
      break;
    case 'focusin':
      reactEventType = 'focus';
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'focusout':
      reactEventType = 'blur';
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'beforeblur':
    case 'afterblur':
      SyntheticEventCtor = SyntheticFocusEvent;
      break;
    case 'click':
      if (nativeEvent.button === 2) {
        return;
      }
    case 'auxclick':
    case 'dblclick':
    case 'mousedown':
    case 'mousemove':
    case 'mouseup':
    case 'mouseout':
    case 'mouseover':
    case 'contextmenu':
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    case 'drag':
    case 'dragend':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'dragstart':
    case 'drop':
      SyntheticEventCtor = SyntheticDragEvent;
      break;
    case 'touchcancel':
    case 'touchend':
    case 'touchmove':
    case 'touchstart':
      SyntheticEventCtor = SyntheticTouchEvent;
      break;
    case ANIMATION_END:
    case ANIMATION_ITERATION:
    case ANIMATION_START:
      SyntheticEventCtor = SyntheticAnimationEvent;
      break;
    case TRANSITION_END:
      SyntheticEventCtor = SyntheticTransitionEvent;
      break;
    case 'scroll':
      SyntheticEventCtor = SyntheticUIEvent;
      break;
    case 'wheel':
      SyntheticEventCtor = SyntheticWheelEvent;
      break;
    case 'copy':
    case 'cut':
    case 'paste':
      SyntheticEventCtor = SyntheticClipboardEvent;
      break;
    case 'gotpointercapture':
    case 'lostpointercapture':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'pointerup':
      SyntheticEventCtor = SyntheticPointerEvent;
      break;
    default:
      // Unknown event. This is used by createEventHandle.
      break;
  }

  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  if (
    enableCreateEventHandleAPI &&
    eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE
  ) {
    const listeners = accumulateEventHandleNonManagedNodeListeners(
      ((reactEventType: any): DOMEventName),
      targetContainer,
      inCapturePhase,
    );
    if (listeners.length > 0) {
      const event = new SyntheticEventCtor(
        reactName,
        reactEventType,
        null,
        nativeEvent,
        nativeEventTarget,
      );
      dispatchQueue.push({event, listeners});
    }
  } else {
    const accumulateTargetOnly =
      !inCapturePhase &&
      domEventName === 'scroll';

    const listeners = accumulateSinglePhaseListeners(
      targetInst,
      reactName,
      nativeEvent.type,
      inCapturePhase,
      accumulateTargetOnly,
      nativeEvent,
    );
    if (listeners.length > 0) {
      const event = new SyntheticEventCtor(
        reactName,
        reactEventType,
        null,
        nativeEvent,
        nativeEventTarget,
      );
      dispatchQueue.push({event, listeners});
    }
  }
}
```

9. `accumulateSinglePhaseListeners()`

```typescript
export function accumulateSinglePhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null,
  nativeEventType: string,
  inCapturePhase: boolean,
  accumulateTargetOnly: boolean,
  nativeEvent: AnyNativeEvent,
): Array<DispatchListener> {
  const captureName = reactName !== null ? reactName + 'Capture' : null;
  const reactEventName = inCapturePhase ? captureName : reactName;
  let listeners: Array<DispatchListener> = [];

  let instance = targetFiber;
  let lastHostComponent = null;

  // Accumulate all instances and listeners via the target -> root path.
  while (instance !== null) {
    const {stateNode, tag} = instance;
    // Handle listeners that are on HostComponents (i.e. <div>)
    // 主要是走这里
    if (tag === HostComponent && stateNode !== null) {
      lastHostComponent = stateNode;

      // createEventHandle listeners
      if (enableCreateEventHandleAPI) {
        const eventHandlerListeners = getEventHandlerListeners(
          lastHostComponent,
        );
        if (eventHandlerListeners !== null) {
          eventHandlerListeners.forEach(entry => {
            if (
              entry.type === nativeEventType &&
              entry.capture === inCapturePhase
            ) {
              listeners.push(
                createDispatchListener(
                  instance,
                  entry.callback,
                  (lastHostComponent: any),
                ),
              );
            }
          });
        }
      }

      // Standard React on* listeners, i.e. onClick or onClickCapture
      // 然后取上面的 listener 处理函数
      if (reactEventName !== null) {
        const listener = getListener(instance, reactEventName);
        if (listener != null) {
          listeners.push(
            createDispatchListener(instance, listener, lastHostComponent),
          );
        }
      }
    } else if (
      enableCreateEventHandleAPI &&
      enableScopeAPI &&
      tag === ScopeComponent &&
      lastHostComponent !== null &&
      stateNode !== null
    ) {
      // Scopes
      const reactScopeInstance = stateNode;
      const eventHandlerListeners = getEventHandlerListeners(
        reactScopeInstance,
      );
      if (eventHandlerListeners !== null) {
        eventHandlerListeners.forEach(entry => {
          if (
            entry.type === nativeEventType &&
            entry.capture === inCapturePhase
          ) {
            listeners.push(
              createDispatchListener(
                instance,
                entry.callback,
                (lastHostComponent: any),
              ),
            );
          }
        });
      }
    }

    if (accumulateTargetOnly) {
      break;
    }

    if (enableCreateEventHandleAPI && nativeEvent.type === 'beforeblur') {
      // $FlowFixMe: internal field
      const detachedInterceptFiber = nativeEvent._detachedInterceptFiber;
      if (
        detachedInterceptFiber !== null &&
        (detachedInterceptFiber === instance ||
          detachedInterceptFiber === instance.alternate)
      ) {
        listeners = [];
      }
    }

    // 一直向上找
    instance = instance.return;
  }

  // 最后将所有的 listener 处理函数返回
  return listeners;
}
```

9. `processDispatchQueue()`

```typescript
export function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
  }

  rethrowCaughtError();
}
// 按照捕获、冒泡的顺序
function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean
): void {
  let previousInstance;

  // 捕获阶段
  if (inCapturePhase) {
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      // 在 try catch 中执行 listener，将 event 作为 this
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  }
  // 冒泡阶段
  else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { instance, currentTarget, listener } = dispatchListeners[i];
      if (instance !== previousInstance && event.isPropagationStopped()) {
        return;
      }
      // 在 try catch 中执行 listener，将 event 作为 this
      executeDispatch(event, listener, currentTarget);
      previousInstance = instance;
    }
  }
}
```

```typescript

```

<Footer />
