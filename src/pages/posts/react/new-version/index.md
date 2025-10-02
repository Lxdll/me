---
title: 'React 19 新版改动'
date: '2025-09-16'
duration: 12min
lang: zh
---

## React 19

### 1. 删除了已弃用的 React APIs

- 在 `React` 19 版本中，移除了 `propType` 的检查，这些检查会被忽略，建议使用 `TypeScript` 和其他的类型检查方案。
- 在函数组件中，弃用 `defaultProps`，因为 ES6 有默认参数。

```typescript
// Before
import PropTypes from 'prop-types';

function Heading({text}) {
  return <h1>{text}</h1>;
}
Heading.propTypes = {
  text: PropTypes.string,
};
Heading.defaultProps = {
  text: 'Hello, world!',
};

// After
interface Props {
  text?: string;
}
function Heading({text = 'Hello, world!'}: Props) {
  return <h1>{text}</h1>;
}
```

- 在类组件中，弃用 `contextTypes` and `getChildContext()`。

```typescript
// Before
import PropTypes from 'prop-types';

class Parent extends React.Component {
  static childContextTypes = {
    foo: PropTypes.string.isRequired,
  };

  getChildContext() {
    return { foo: 'bar' };
  }

  render() {
    return <Child />;
  }
}

class Child extends React.Component {
  static contextTypes = {
    foo: PropTypes.string.isRequired,
  };

  render() {
    return <div>{this.context.foo}</div>;
  }
}

// After
const FooContext = React.createContext();

class Parent extends React.Component {
  render() {
    return (
      <FooContext value='bar'>
        <Child />
      </FooContext>
    );
  }
}

class Child extends React.Component {
  static contextType = FooContext;

  render() {
    return <div>{this.context}</div>;
  }
}
```

### 2. `forwardRef` 不再是必须的，推荐 `ref as prop`

在 React 19 版本中，forwardRef 这个 API 不是必需的了，可以将 ref 作为 prop 来传递。

```typescript
// before
import { forwardRef } from 'react';

const MyInput = forwardRef(function MyInput(props, ref) {
  // ...
});

// After
function MyInput({placeholder, ref}) {
  return <input placeholder={placeholder} ref={ref} />
}

//...
<MyInput ref={ref} />
```

<Footer />
