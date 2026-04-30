"use client";

import {
  Renderer,
  StateProvider,
  ActionProvider,
  VisibilityProvider,
  ValidationProvider,
  useUIStream,
} from "@json-render/react";
import { componentRegistry } from "./component-registry";

export function CanvasInterface() {
  const { spec, isStreaming, send } = useUIStream({
    api: "/api/canvas",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    send(formData.get("prompt") as string);
  };

  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider
          handlers={{
            submit: (params) => console.log("Submit: ", params),
            navigate: (params) => console.log("Navigate: ", params),
          }}
        >
          <ValidationProvider customFunctions={{}}>
            <form onSubmit={handleSubmit}>
              <input
                name="prompt"
                placeholder="Describe what you need"
                className="border p-2 rounded"
              />
              <button type="submit" disabled={isStreaming}>
                Generate
              </button>
            </form>

            <div className="mt-8">
              <Renderer
                spec={spec}
                registry={componentRegistry}
                loading={isStreaming}
              />
            </div>
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}
