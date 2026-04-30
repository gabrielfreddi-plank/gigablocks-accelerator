import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";

export const componentCatalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Separator: shadcnComponentDefinitions.Separator,
    Grid: shadcnComponentDefinitions.Grid,

    Accordion: shadcnComponentDefinitions.Accordion,
    Collapsible: shadcnComponentDefinitions.Collapsible,
    Tabs: shadcnComponentDefinitions.Tabs,

    Heading: shadcnComponentDefinitions.Heading,
    Text: shadcnComponentDefinitions.Text,
    Table: shadcnComponentDefinitions.Table,

    Skeleton: shadcnComponentDefinitions.Skeleton,
    Spinner: shadcnComponentDefinitions.Spinner,

    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,
    Textarea: shadcnComponentDefinitions.Textarea,
    Select: shadcnComponentDefinitions.Select,
    Checkbox: shadcnComponentDefinitions.Checkbox,
    Radio: shadcnComponentDefinitions.Radio,
    Switch: shadcnComponentDefinitions.Switch,
    Toggle: shadcnComponentDefinitions.Toggle,
    ToggleGroup: shadcnComponentDefinitions.ToggleGroup,
  },
  actions: {},
});
