---
title: JavaScript 面试题
---

### `var`、`let` 和 `const` 区别

1. 作用域不同：`var` 是函数作用域，`let` 和 `const` 是块级作用域。
2. 变量提升：`var` 存在变量提升，会把所有变量声明拉到函数作用域顶部。`let` 和 `const` 没有变量提升，在作用域中声明之前存在`暂时性死区`。
3. 全局声明：用 `var` 在全局作用域中声明的变量，会成为 `window` 的属性。
4. 重复声明：`var` 可以重复声明，`let` 和 `const` 不可以。
5. 初始值：`const` 在声明变量时必须指定初始值，`var` 和 `let` 可以先不指定初始值。

#### 最佳实践：

1. `不使用 var`：有了 let 和 const，大多数开发者会发现自己不再需要 var 了。限制自己只使用 let 和 const 有助于提升代码质量，因为变量有了明确的作用域、声明位置，以及不变的值。

2. `const 优先，let 次之`：使用 const 声明可以让浏览器运行时强制保持变量不变，也可以让静态代码分析工具提前发现不合法的赋值操作。因此，很多开发者认为应该优先使用 const 来声明变量，只在提前知道未来会有修改时用 let。

### new 一个构造函数之后发生了什么

概括：创建一个新对象，把新对象的原型指向函数的原型，绑定 `this`，最后执行函数中代码，返回这个对象（如果构造函数返回非空对象，则返回该对象;否则，返回刚创建的新对象）。

1. 在内存中创建一个新对象。
2. 这个新对象内部的 `[[ProtoType]]` 特性被赋值为构造函数的 `prototype`。
3. 构造函数内部的 `this` 被赋值为这个新对象。
4. 执行构造函数内部的代码。
5. 如果构造函数返回非空对象，则返回该对象；否则，返回刚创建的新对象。

### 函数声明和函数表达式有什么区别

函数声明这种方式有`函数声明提升`。JavaScript 引擎在任何代码执行之前，会先读取函数声明，并在执行上下文中生成函数定义。

### `<script>` 标签的 `defer` 和 `async` 属性

`defer`：这个属性表示脚本在执行的时候不会改变页面的结构。也就是说，脚本会被延迟到整个页面都解析完毕后再运行。因此，在 `<script>` 元素上设置 `defer` 属性，相当于告诉浏览器立即下载，但延迟执行，即使 `<script>` 标签在 `<head>` 标签中。

`async`：给脚本添加 `async` 属性的目的是告诉浏览器，不必等脚本下载和执行完后再加载页面，同样也不必等到该异步脚本下载和执行后再加载其他脚本。标记为 `async` 的脚本并不保证能按照它们出现的次序执行。

#### 区别：

`async` 和 `defer` 的脚本都会并行下载，`async` 脚本下载完成后就立即执行，顺序不固定，会阻塞 HTML 解析渲染，而 defer 会在 HTML 解析完成后执行，不会阻塞解析，会按照文档顺序执行。

### React 为什么要引入 hooks？

React 引入 `Hook` 是为了让函数组件能拥有状态和副作用的能力，同时解决类组件在逻辑复用、代码组织和可维护性上的痛点。

1. `逻辑复用困难`：

在类组件中，如果你想复用状态逻辑（例如订阅事件、表单处理、请求数据），通常需要用高阶组件（`HOC`） 或 `render props`。
这些方式容易导致 嵌套地狱（`Wrapper Hell`），让代码层级越来越深，可读性和维护性差。
`Hook` 允许你把 状态逻辑 抽离成自定义 `Hook`，例如 `useFetch`、`useAuth`，代码复用变得非常自然。

2. `类组件本身的问题`：

`this` 绑定容易出错，经常要写 `.bind(this)` 或箭头函数来避免。
生命周期函数（`componentDidMount`、`componentDidUpdate`、`componentWillUnmount`）经常把不相关的逻辑混在一起，导致代码不清晰。
Hook 通过函数调用顺序来管理状态和副作用，避免了 `this` 的困扰，同时让逻辑更聚合。

3. `状态逻辑拆分更清晰`：

在类组件中，如果一个组件既要处理 `订阅事件` 又要处理 `数据请求`，这些逻辑可能都塞进 `componentDidMount` 和 `componentWillUnmount` 里，杂糅在一起。
`Hook` 可以把逻辑拆分成多个 `useEffect`，让每块逻辑保持独立和可维护。

4. `函数组件可以拥有状态`：

引入 `Hook` 后，函数组件通过 `useState`、`useReducer` 就能管理本地状态，和类组件一样强大。

### React 中的类组件和函数组件有什么区别？

1. `定义方式不同`:

函数组件本质上就是一个函数，接收 `props`，然后返回 `JSX`。

类组件是一个继承自 `React.Component` 基类的类，必须实现 `render()` 方法。

2. `状态管理方式不同`：

函数组件通过 Hooks（`useState()`、`useReducer()`）来管理状态。

类组件的状态存储在 `this.state` 上，通过 `this.setState` 更新状态。

3. `生命周期`：

函数组件可以通过 `useEffect()` 来模拟生命周期，使用 `useLayoutEffect()` 来执行 DOM 更新后的同步逻辑。

类组件有 `componentDidMount()`、`componentDidUpdate()`、`componentWillUnmount()`

4. `this` 的问题：

类组件需要注意 `this` 的绑定。

5. `并发特性`：

完全支持 React 并发特性（如 `startTransition`, `useTransition`, `useDeferredValue`, `useOptimistic`, `use` 等）。几乎所有新特性只支持函数组件。

基本停更，新特性不会支持类组件（例如 `use` API）。

6. `代码简洁度、可复用性`：

函数组件代码更简洁，逻辑可以抽离为自定义 `Hook`，可复用性高。

逻辑分散在生命周期方法里，复用需要高阶组件（`HOC`）或 `Render Props`，复杂度高。

### 跨域

跨域指的是浏览器在执行同源策略时，阻止不同源之间的请求和数据访问。

同源 = 协议 + 域名 + 端口号 都相同。

#### 如何解决？

1. `CORS`：跨域资源共享：

服务端在响应头里添加：

```typescript
Access-Control-Allow-Origin: https://your-frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

2. `JSONP`：

利用 `<script>` 标签不受同源策略限制。但是只能 `GET` 请求。

3. `反向代理`：

开发服务器（如 webpack devServer、vite、nginx）把 /api 请求代理到真正的跨域接口。

4. `PostMessage`：

两个窗口之间的通信。

### 如何将一个对象属性变为不可访问的？

1. `Object.defineProperty()`
2. `Object.freeze()`：

冻结整个对象，浅层，深层还是可以修改。

3. `Object.seal()`：

修改已有属性值可行，但是不能新增和删除属性。

4. `new Proxy()`：

可自定义控制逻辑。

### 判断数据类型：

1. `typeof`:

判断基本类型可以，但是对于 null、对象、数组判断不清晰。

2. `instanceof`：

用来判断构造函数的实例。

3. `Array.isArray()`：

仅用来判断数组。

4. `Object.prototype.toString.call()`：

```typescript
Object.prototype.toString.call([]); // "[object Array]"
Object.prototype.toString.call({}); // "[object Object]"
Object.prototype.toString.call(null); // "[object Null]"
Object.prototype.toString.call(undefined); // "[object Undefined]"
Object.prototype.toString.call(/a/); // "[object RegExp]"
Object.prototype.toString.call(new Date()); // "[object Date]"
```

<Footer />
