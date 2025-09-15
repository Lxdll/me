## valueCursor

其实 `valueCursor` 就是一个把值保存在 `current` 属性上的对象。

在 `React` 的`Context` 中，始终保存着最里面的 `context` 的值。利用一个 `valueStack` 的数组，配合 `push` 和 `pop` 方法，用栈来存 `context` 的历史值。

```typescript
function createCursor<T>(defaultValue: T): StackCursor<T> {
  return {
    current: defaultValue,
  };
}
```

- `push()`: 将上一层的 `context` 值放到 `valueCursor`，然后把历史值放到 `valueStack` 中。

- `pop()`: 将栈顶的值恢复到 `valueCursor` 上。

```typescript
let index = -1;
const valueStack: Array<any> = [];

function pop<T>(cursor: StackCursor<T>, fiber: Fiber): void {
  if (index < 0) {
    return;
  }

  cursor.current = valueStack[index];
  valueStack[index] = null;
  index--;
}

function push<T>(cursor: StackCursor<T>, value: T, fiber: Fiber): void {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
```

<Footer />
