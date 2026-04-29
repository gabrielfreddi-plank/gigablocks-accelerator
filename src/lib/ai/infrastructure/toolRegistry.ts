import type {
  ToolDefinition,
  ToolRegistryPort,
} from "@/lib/ai/ports/toolRegistry";
import {
  calculatorTool,
  getCurrentTimeTool,
  urlExtractTool,
  webSearchTool,
} from "./tools";

export class ToolRegistry implements ToolRegistryPort {
  private readonly definitions: ToolDefinition[] = [
    getCurrentTimeTool,
    calculatorTool,
    webSearchTool,
    urlExtractTool,
  ];

  getDefinitions(): ToolDefinition[] {
    return this.definitions;
  }

  getByName(name: string): ToolDefinition | null {
    return this.definitions.find((tool) => tool.name === name) ?? null;
  }
}
