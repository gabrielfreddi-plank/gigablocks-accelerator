import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";

import { componentCatalog } from "./component-catalog";
import { Alert } from "./ui/Alert";
import { Badge } from "./ui/Badge";
import { BarChart } from "./ui/BarChart";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Grid } from "./ui/Grid";
import { Checkbox } from "./ui/Checkbox";
import { Heading } from "./ui/Heading";
import { Input } from "./ui/Input";
import { KpiCard } from "./ui/KpiCard";
import { LineChart } from "./ui/LineChart";
import { Progress } from "./ui/Progress";
import { Radio } from "./ui/Radio";
import { Select } from "./ui/Select";
import { Skeleton } from "./ui/Skeleton";
import { Slider } from "./ui/Slider";
import { Spinner } from "./ui/Spinner";
import { Switch } from "./ui/Switch";
import { Text } from "./ui/Text";
import { Textarea } from "./ui/Textarea";

export const { registry: componentRegistry } = defineRegistry(
  componentCatalog,
  {
    components: {
      // Layout
      Card,
      Grid,
      Stack: shadcnComponents.Stack,
      Separator: shadcnComponents.Separator,

      // Navigation
      Accordion: shadcnComponents.Accordion,
      Collapsible: shadcnComponents.Collapsible,
      Tabs: shadcnComponents.Tabs,

      // Content
      Heading,
      Text,
      Badge,
      Table: shadcnComponents.Table,

      // Feedback
      Alert,
      Skeleton,
      Spinner,
      Progress,

      // Charts & KPIs
      KpiCard,
      BarChart,
      LineChart,

      // Form inputs — custom implementations
      Button,
      Input,
      Textarea,
      Checkbox,
      Radio,
      Select,
      Switch,
      Slider,

      // Navigation inputs — shadcn
      Toggle: shadcnComponents.Toggle,
      ToggleGroup: shadcnComponents.ToggleGroup,
    },
  },
);
