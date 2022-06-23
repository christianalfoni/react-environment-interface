import * as React from "react";

export interface IEvent {
  type: string;
}

export type TEmit<T extends IEvent> = (event: T) => void;

export type TSubscribe<T extends IEvent> = (
  listener: (event: T) => void
) => void;

export type TEmitter<T extends IEvent> = {
  emit: TEmit<T>;
  subscribe: TSubscribe<T>;
};

export const createEmitter = <T extends IEvent>(): TEmitter<T> => {
  const listeners: TEmit<T>[] = [];

  return {
    emit(event) {
      listeners.forEach((listener) => listener(event));
    },
    subscribe(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
  };
};

export interface IEnvironment {}

export const defineEnvironment = <T extends IEnvironment>() => {
  const environmentContext = React.createContext(null as unknown as T);
  const useEnvironment = () => React.useContext(environmentContext);
  const createEnvironment = (constr: () => T) => constr();
  const EnvironmentProvider: React.FC<{
    environment: T;
    children: React.ReactNode;
  }> = ({ environment, children }) => {
    return (
      <environmentContext.Provider value={environment}>
        {children}
      </environmentContext.Provider>
    );
  };

  return {
    createEnvironment,
    useEnvironment,
    EnvironmentProvider,
    EnvironmentConsumer: environmentContext.Consumer,
  };
};
