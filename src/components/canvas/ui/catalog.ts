import { z } from "zod";

const checksSchema = z
  .array(
    z.object({
      type: z.string(),
      message: z.string(),
      args: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .nullable();

const validateOnSchema = z.enum(["change", "blur", "submit"]).nullable();

export const customComponentDefinitions = {
  // Layout
  Stack: {
    props: z.object({
      direction: z.enum(["horizontal", "vertical"]).nullable().optional(),
      gap: z.enum(["none", "sm", "md", "lg", "xl"]).nullable().optional(),
      align: z
        .enum(["start", "center", "end", "stretch"])
        .nullable()
        .optional(),
      justify: z
        .enum(["start", "center", "end", "between", "around"])
        .nullable()
        .optional(),
    }),
    events: [],
    description:
      "Flex container, full width. Use as the default grouping wrapper inside any parent container before placing dense children (forms/content/charts). direction: vertical (default)/horizontal. gap between children: none/sm/md (default, 24px)/lg (40px)/xl (64px). align: start/center/end/stretch (default start). justify: start/center/end/between/around.",
    example: { direction: "horizontal", gap: "md", align: "center" },
  },

  Section: {
    props: z.object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      padding: z.enum(["none", "sm", "md", "lg"]).nullable().optional(),
      gap: z.enum(["none", "sm", "md", "lg"]).nullable().optional(),
      divider: z.boolean().nullable().optional(),
    }),
    events: [],
    description:
      "Full-width flex-col container. Use for page sections, navbar areas, content blocks. title/description render as a section header. padding: none/sm/md (default)/lg. gap: vertical gap between children — none/sm/md (default, 24px)/lg. divider: true adds a bottom border.",
    example: {
      title: "Overview",
      description: "Summary of recent activity",
      padding: "md",
      gap: "md",
    },
  },

  Grid: {
    props: z.object({
      cols: z
        .union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(6),
          z.literal(12),
        ])
        .nullable()
        .optional(),
      gap: z.enum(["none", "sm", "md", "lg"]).nullable().optional(),
    }),
    events: [],
    description:
      "CSS grid wrapper. cols: 1/2 (default)/3/4/6/12. gap: none/sm/md (default)/lg. Nest child components inside.",
    example: { cols: 3, gap: "md" },
  },

  Card: {
    props: z.object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      maxWidth: z.enum(["sm", "md", "lg", "full"]).nullable().optional(),
      centered: z.boolean().nullable().optional(),
    }),
    events: [],
    description:
      "Dark card container. For forms and dense content, add a Stack or Section as the immediate child and place controls inside that wrapper (avoid placing many inputs/buttons directly under Card). Don't use for content layout, use Section instead. maxWidth: sm/md/lg/full (default full). centered: true for mx-auto.",
    example: { title: "Revenue", description: "Monthly breakdown" },
  },

  // Content
  Heading: {
    props: z.object({
      text: z.string(),
      level: z.enum(["h1", "h2", "h3", "h4"]).nullable().optional(),
    }),
    events: [],
    description:
      "Section heading. level: h1 (4xl bold), h2 (3xl semibold, default), h3 (xl), h4 (base).",
    example: { text: "Dashboard", level: "h1" },
  },

  Text: {
    props: z.object({
      text: z.string(),
      variant: z
        .enum(["body", "caption", "muted", "lead", "code"])
        .nullable()
        .optional(),
    }),
    events: [],
    description:
      "Paragraph / inline text. variant: body (default), caption (xs muted), muted (sm muted), lead (lg), code (monospace pill).",
    example: { text: "Showing results for last 30 days.", variant: "muted" },
  },

  Badge: {
    props: z.object({
      text: z.string(),
      variant: z
        .enum(["default", "success", "warning", "error", "secondary"])
        .nullable()
        .optional(),
    }),
    events: [],
    description:
      "Pill badge. variant: default (blue), success (emerald), warning (amber), error (red), secondary (zinc).",
    example: { text: "Active", variant: "success" },
  },

  Alert: {
    props: z.object({
      title: z.string(),
      message: z.string().nullable().optional(),
      type: z
        .enum(["info", "success", "warning", "error"])
        .nullable()
        .optional(),
    }),
    events: [],
    description:
      "Inline alert with icon and left border. type: info (default), success, warning, error.",
    example: {
      title: "Saved",
      message: "Your changes have been saved.",
      type: "success",
    },
  },

  // Feedback
  Spinner: {
    props: z.object({
      size: z.enum(["sm", "md", "lg"]).nullable().optional(),
      label: z.string().nullable().optional(),
    }),
    events: [],
    description:
      "Animated loading spinner. size: sm/md (default)/lg. Optional text label alongside.",
    example: { size: "md", label: "Loading…" },
  },

  Progress: {
    props: z.object({
      value: z.number(),
      max: z.number().nullable().optional(),
      label: z.string().nullable().optional(),
    }),
    events: [],
    description:
      "Horizontal progress bar. value 0–max (default 100). Shows label + % when label provided.",
    example: { value: 72, label: "Upload progress" },
  },

  Skeleton: {
    props: z.object({
      width: z.string().nullable().optional(),
      height: z.string().nullable().optional(),
      rounded: z.boolean().nullable().optional(),
    }),
    events: [],
    description:
      "Shimmer loading placeholder. width/height accept CSS values (e.g. '100%', '2rem'). rounded: true for pill shape.",
    example: { width: "100%", height: "1.5rem" },
  },

  // Charts & KPIs
  KpiCard: {
    props: z.object({
      label: z.string(),
      value: z.string(),
      unit: z.string().nullable().optional(),
      trend: z.enum(["up", "down", "neutral"]).nullable().optional(),
      trendValue: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
    }),
    events: [],
    description:
      "Metric card with large value, optional unit, trend badge (up/down/neutral), and description. Use trendValue for the badge text (e.g. '+12%').",
    example: {
      label: "MRR",
      value: "24,800",
      unit: "$",
      trend: "up",
      trendValue: "+8%",
      description: "vs last month",
    },
  },

  BarChart: {
    props: z.object({
      title: z.string().nullable().optional(),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
      color: z
        .enum(["blue", "emerald", "violet", "amber", "rose"])
        .nullable()
        .optional(),
    }),
    events: [],
    description:
      "Vertical bar chart. data: [{label, value}]. color: blue (default)/emerald/violet/amber/rose.",
    example: {
      title: "Monthly Sales",
      data: [
        { label: "Jan", value: 420 },
        { label: "Feb", value: 380 },
      ],
      color: "blue",
    },
  },

  LineChart: {
    props: z.object({
      title: z.string().nullable().optional(),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
      color: z
        .enum(["blue", "emerald", "violet", "amber", "rose"])
        .nullable()
        .optional(),
      showArea: z.boolean().nullable().optional(),
    }),
    events: [],
    description:
      "Area/line chart. data: [{label, value}]. showArea: true (default) fills gradient under line. color: blue (default)/emerald/violet/amber/rose.",
    example: {
      title: "Revenue Trend",
      data: [
        { label: "Q1", value: 12000 },
        { label: "Q2", value: 18500 },
      ],
      color: "emerald",
    },
  },

  // Form inputs
  Button: {
    props: z.object({
      label: z.string(),
      variant: z.enum(["primary", "secondary", "ghost", "danger"]).nullable(),
      size: z.enum(["sm", "md", "lg"]).nullable(),
      disabled: z.boolean().nullable(),
      fullWidth: z.boolean().nullable(),
    }),
    events: ["press"],
    description:
      "Clickable button. variant: primary (blue, default), secondary (zinc), ghost (transparent), danger (red). Bind on.press for handler.",
    example: { label: "Submit", variant: "primary" },
  },

  Input: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      type: z.enum(["text", "email", "password", "number"]).nullable(),
      placeholder: z.string().nullable(),
      value: z.string().nullable(),
      hint: z.string().nullable(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["submit", "focus", "blur"],
    description:
      "Text input with label. Use { $bindState } on value for two-way binding. Use checks for validation (e.g. required, email, minLength). validateOn controls timing (default: blur).",
    example: {
      label: "Email",
      name: "email",
      type: "email",
      placeholder: "you@example.com",
    },
  },

  Textarea: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      placeholder: z.string().nullable(),
      rows: z.number().nullable(),
      value: z.string().nullable(),
      hint: z.string().nullable(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["blur"],
    description:
      "Multi-line text input. Use { $bindState } on value for binding. Use checks for validation. validateOn controls timing (default: blur).",
  },

  Checkbox: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      checked: z.boolean().nullable(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["change"],
    description:
      "Checkbox input. Use { $bindState } on checked for binding. Use checks for validation. validateOn controls timing (default: change).",
  },

  Radio: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      options: z.array(z.string()),
      value: z.string().nullable(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["change"],
    description:
      "Radio button group. Use { $bindState } on value for binding. Use checks for validation. validateOn controls timing (default: change).",
  },

  Select: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      options: z.array(z.string()),
      placeholder: z.string().nullable().optional(),
      value: z.string().nullable().optional(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["change"],
    description:
      "Dropdown select. options: string[]. Use { $bindState } on value for binding. placeholder shown when empty.",
    example: {
      label: "Country",
      name: "country",
      options: ["USA", "UK", "Canada"],
      placeholder: "Select country…",
    },
  },

  Switch: {
    props: z.object({
      label: z.string(),
      name: z.string(),
      checked: z.boolean().nullable().optional(),
      checks: checksSchema,
      validateOn: validateOnSchema,
    }),
    events: ["change"],
    description:
      "Toggle switch. Use { $bindState } on checked for binding. Glows blue when on.",
    example: { label: "Enable notifications", name: "notifications" },
  },

  Slider: {
    props: z.object({
      label: z.string().nullable().optional(),
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      step: z.number().nullable().optional(),
      value: z.number().nullable().optional(),
    }),
    events: ["change"],
    description:
      "Range slider. min/max/step default to 0/100/1. Use { $bindState } on value for binding.",
    example: { label: "Volume", min: 0, max: 100, step: 5, value: 60 },
  },
};
