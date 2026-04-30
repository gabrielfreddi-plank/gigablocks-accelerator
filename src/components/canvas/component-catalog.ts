import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";

import { customComponentDefinitions } from "./ui/catalog";

export const componentCatalog = defineCatalog(schema, {
  components: {
    // Layout
    Section: customComponentDefinitions.Section,
    Card: customComponentDefinitions.Card,
    Grid: customComponentDefinitions.Grid,
    Stack: customComponentDefinitions.Stack,
    Separator: shadcnComponentDefinitions.Separator,

    // Navigation
    Accordion: shadcnComponentDefinitions.Accordion,
    Collapsible: shadcnComponentDefinitions.Collapsible,
    Tabs: shadcnComponentDefinitions.Tabs,

    // Content
    Heading: customComponentDefinitions.Heading,
    Text: customComponentDefinitions.Text,
    Badge: customComponentDefinitions.Badge,
    Table: shadcnComponentDefinitions.Table,

    // Feedback
    Alert: customComponentDefinitions.Alert,
    Skeleton: customComponentDefinitions.Skeleton,
    Spinner: customComponentDefinitions.Spinner,
    Progress: customComponentDefinitions.Progress,

    // Charts & KPIs
    KpiCard: customComponentDefinitions.KpiCard,
    BarChart: customComponentDefinitions.BarChart,
    LineChart: customComponentDefinitions.LineChart,

    // Form inputs — custom implementations
    Button: customComponentDefinitions.Button,
    Input: customComponentDefinitions.Input,
    Textarea: customComponentDefinitions.Textarea,
    Checkbox: customComponentDefinitions.Checkbox,
    Radio: customComponentDefinitions.Radio,
    Select: customComponentDefinitions.Select,
    Switch: customComponentDefinitions.Switch,
    Slider: customComponentDefinitions.Slider,

    // Navigation inputs — shadcn
    Toggle: shadcnComponentDefinitions.Toggle,
    ToggleGroup: shadcnComponentDefinitions.ToggleGroup,
  },
  actions: {
    navigate: {
      description:
        'Trigger navigation. Use for button presses that should load a new page or view. Param: target (string) — the destination page name (e.g. "dashboard", "settings", "profile").',
    },
    submit: {
      description:
        "Submit a form. Use for primary form submit buttons. Params: include the current form field values as key/value pairs so the next page can reference them.",
    },
  },
});
