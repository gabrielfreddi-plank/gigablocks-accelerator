import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { componentCatalog } from "./component-catalog";

export const { registry: componentRegistry } = defineRegistry(
  componentCatalog,
  {
    components: {
      Card: shadcnComponents.Card,
      Stack: shadcnComponents.Stack,
      Separator: shadcnComponents.Separator,
      Grid: shadcnComponents.Grid,

      Accordion: shadcnComponents.Accordion,
      Collapsible: shadcnComponents.Collapsible,
      Tabs: shadcnComponents.Tabs,

      Heading: shadcnComponents.Heading,
      Text: shadcnComponents.Text,
      Table: shadcnComponents.Table,

      Skeleton: shadcnComponents.Skeleton,
      Spinner: shadcnComponents.Spinner,

      Button: shadcnComponents.Button,
      Input: shadcnComponents.Input,
      Textarea: shadcnComponents.Textarea,
      Select: shadcnComponents.Select,
      Checkbox: shadcnComponents.Checkbox,
      Radio: shadcnComponents.Radio,
      Switch: shadcnComponents.Switch,
      Toggle: shadcnComponents.Toggle,
      ToggleGroup: shadcnComponents.ToggleGroup,
    },
  },
);
