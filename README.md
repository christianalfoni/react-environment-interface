# react-environment-interface

Define and consume a custom environment for your application

## Why?

Defining an interface between your application and the environment it runs in gives several benefits:

- Your application code does not use environment specific APIs that is not related to the domain of the application
- The return type of requests to the environment is tailored to what your application needs
- No magical strings in your application code
- Make the environment consistent with promises, events, observables etc.
- Avoid mocking imports and NPM packages, mock the environment interface instead when testing the application
- Load the same app in different environments like testing, server and native. It uses the same environment interface, but implementations differ
- Consistent definition and import of types

## How?

First define your environment in a folder called `environment-interface`. With bigger interfaces you can split it up into multiple files.

```ts
import { createEnvironment, TEmitter } from "react-environment-interface";
import { Api } from "./api";
import { Visibility } from "./visibility";

export interface Environment {
  api: Api;
  visibility: Visibility;
}

const { EnvironmentProvider, useEnvironment, EnvironmentConsumer } =
  createEnvironment<Environment>();

export { EnvironmentProvider, useEnvironment, EnvironmentConsumer };
```

We typically define the interface in its own file, `api.ts` here:

```ts
export type Data = { foo: 'bar' }

export Api = {
  fetchData(): Promise<Data>
}
```

And `visibility.ts` here:

```ts
export type VisibilityEvent = { type: 'VISIBLE' } | { type: 'HIDDEN' }

export Visibility = TEmitter<VisibilityEvent>
```

Create your environments in an `environments` folder. Also here you can split into different files and also folders holding the implementation for each environment. Using a factory allows us to pass in any options like environment variables to the instantiation of the environment.

```ts
import { Environment } from "../environment-interface";
import { createVisibility } from "./visibility/browser";
import { createApi } from "./api/browser";

export const createBrowserEnvironment = (): Environment => ({
  visibility: createVisibility(),
  api: createApi(),
});
```

And the implenentation is put into a folder, here with the browser implementation in `visibility/browser.ts`. We use
factories to allow instantiation and pass in options like environment variables etc.

```ts
import { createEmitter } from "react-environment-interface";
import {
  TVisibility,
  TVisibilityEvent,
} from "../../environment-interface/visibility";

export const createVisibility = (): Visibility => {
  const emitter = createEmitter<VisibilityEvent>();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      emitter.emit({ type: "HIDDEN" });
    } else {
      emitter.emit({ type: "VISIBLE" });
    }
  });

  return emitter;
};
```

And now the `api/browser.ts` implementation:

```ts
import { Api } from "../../environment-interface/api";

export const createVisibility = (): Api => ({
  fetchData: () => fetch("/api/data").then((response) => response.json()), // Now typed to Data
});
```

To expose the environment we simply:

```tsx
import { App } from "./App";
import { createBrowserEnvironment } from "../environments/browser.ts";

const browserEnvironment = createBrowserEnvironment();

export const AppWrapper = () => {
  return (
    <EnvironmentProvider environment={browserEnvironment}>
      <App />
    </EnvironmentProvider>
  );
};
```

And consume it through the hook:

```tsx
import { useEnvironment } from "../environment-interface";

export const SomeComponent = () => {
  const { visibility } = useEnvironment();

  useEffect(() => visibility.subscribe(console.log), []);

  return <div />;
};
```

## Testing

Now we can define a test implementation of the API, using `test.ts` as filename instead.

With the visibility emitter we can just return the emitter where we can simulate events using the `.emit` function directly in our tests.

```ts
import { createEmitter } from "react-environment-interface";
import { Visibility } from "../../environment-interface/visibility";

export const createVisibility = (): Visibility => createEmitter();
```

And now the `api/test.ts` implementation we use a mocked Jest function to detect when `fetchData` is called and what to return.

```ts
import { Api } from "../../environment-interface/api";

export const createVisibility = (): Api => ({
  fetchData: jest.fn(),
});
```

Where a test could be:

```tsx
import { render, act } from "@testing-library/react";
import { createTestEnvironment } from "../environments/test.ts";

test("fetches data when visible", () => {
  // We create a new environment for every test
  const testEnvironment = createTestEnvironment();
  render(
    <EnvironmentProvider environment={testEnvironment}>
      <App />
    </EnvironmentProvider>
  );

  act(() => {
    testEnvironment.visibility.emit({ type: "VISIBLE" });
  });

  expect(testEnvironment.api.fetchData).toBeCalled();
});
```
