---
title: TypeScript 面试题
---

### `type` 和 `interface` 的区别？

1. `扩展方式不同`：

- `interface` 可以 `extends`，支持多重继承。
- `type` 可以使用交叉类型，即 `type A & type B`。

2. `声明合并`：

- `interface` 会合并，同名接口会自动合并属性。
- `type` 不会合并，同名 `type` 会报错。

```typescript
interface Person {
  name: string;
}
interface Person {
  age: number;
}

const p: Person = { name: 'Tom', age: 20 }; // ✅ 合并成功

type Person2 = { name: string };
// ❌ Error: Duplicate identifier 'Person2'
type Person2 = { age: number };
```

3. `使用范围`：

- `type` 更灵活，可以定义 基础类型别名、联合类型、交叉类型、条件类型。
- `interface` 只能描述对象结构。

`总结`： 如果是描述对象结构，`interface` 更直观。如果需要联合、交叉、条件类型，`type` 更强大，复杂类型的逻辑都用 `type`。

<Footer />
