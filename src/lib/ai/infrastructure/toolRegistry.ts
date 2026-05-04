import type {
  ToolDefinition,
  ToolRegistryPort,
} from "@/lib/ai/ports/toolRegistry";
import {
  calculatorTool,
  createDeleteMemoryTool,
  createFetchMemoriesTool,
  createSaveMemoryTool,
  createUpdateMemoryTool,
  getCurrentTimeTool,
  urlExtractTool,
  webSearchTool,
} from "./tools";

export class ToolRegistry implements ToolRegistryPort {
  private readonly definitions: ToolDefinition[];

  constructor(userId: string) {
    this.definitions = [
      getCurrentTimeTool,
      calculatorTool,
      webSearchTool,
      urlExtractTool,
      createFetchMemoriesTool(userId),
      createSaveMemoryTool(userId),
      createUpdateMemoryTool(userId),
      createDeleteMemoryTool(userId),
    ];
  }

  getDefinitions(): ToolDefinition[] {
    return this.definitions;
  }

  getByName(name: string): ToolDefinition | null {
    return this.definitions.find((tool) => tool.name === name) ?? null;
  }
}
