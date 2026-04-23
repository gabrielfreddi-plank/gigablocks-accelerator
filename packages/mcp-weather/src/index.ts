/**
 * Dummy Weather MCP Server — fins didáticos
 *
 * Primitivos usados:
 *   - Tools:     ações que o LLM pode invocar (buscar clima, previsão)
 *   - Resources: dados estáticos que o cliente pode consultar (lista de cidades)
 *   - Prompts:   templates reutilizáveis que o usuário invoca
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Dados fictícios
// ---------------------------------------------------------------------------

type Condition = "Ensolarado" | "Nublado" | "Chuvoso" | "Tempestuoso" | "Nevando";

interface WeatherData {
  city: string;
  country: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_kph: number;
  condition: Condition;
  uv_index: number;
}

const WEATHER_DB: Record<string, WeatherData> = {
  "são paulo": {
    city: "São Paulo",
    country: "BR",
    temperature_c: 24,
    feels_like_c: 26,
    humidity_percent: 72,
    wind_kph: 14,
    condition: "Nublado",
    uv_index: 4,
  },
  "rio de janeiro": {
    city: "Rio de Janeiro",
    country: "BR",
    temperature_c: 31,
    feels_like_c: 36,
    humidity_percent: 80,
    wind_kph: 18,
    condition: "Ensolarado",
    uv_index: 9,
  },
  "new york": {
    city: "New York",
    country: "US",
    temperature_c: 8,
    feels_like_c: 4,
    humidity_percent: 55,
    wind_kph: 25,
    condition: "Nublado",
    uv_index: 2,
  },
  tokyo: {
    city: "Tokyo",
    country: "JP",
    temperature_c: 17,
    feels_like_c: 16,
    humidity_percent: 60,
    wind_kph: 10,
    condition: "Ensolarado",
    uv_index: 5,
  },
  london: {
    city: "London",
    country: "GB",
    temperature_c: 11,
    feels_like_c: 9,
    humidity_percent: 85,
    wind_kph: 20,
    condition: "Chuvoso",
    uv_index: 1,
  },
};

const FORECAST_DB: Record<string, { day: string; condition: Condition; high_c: number; low_c: number }[]> = {
  "são paulo": [
    { day: "Amanhã", condition: "Chuvoso", high_c: 22, low_c: 17 },
    { day: "Depois de amanhã", condition: "Nublado", high_c: 23, low_c: 18 },
    { day: "Em 3 dias", condition: "Ensolarado", high_c: 27, low_c: 19 },
  ],
  "rio de janeiro": [
    { day: "Amanhã", condition: "Ensolarado", high_c: 33, low_c: 25 },
    { day: "Depois de amanhã", condition: "Tempestuoso", high_c: 28, low_c: 23 },
    { day: "Em 3 dias", condition: "Chuvoso", high_c: 26, low_c: 22 },
  ],
  "new york": [
    { day: "Amanhã", condition: "Nevando", high_c: 2, low_c: -3 },
    { day: "Depois de amanhã", condition: "Nublado", high_c: 5, low_c: 0 },
    { day: "Em 3 dias", condition: "Ensolarado", high_c: 9, low_c: 2 },
  ],
  tokyo: [
    { day: "Amanhã", condition: "Ensolarado", high_c: 19, low_c: 12 },
    { day: "Depois de amanhã", condition: "Nublado", high_c: 16, low_c: 11 },
    { day: "Em 3 dias", condition: "Chuvoso", high_c: 14, low_c: 10 },
  ],
  london: [
    { day: "Amanhã", condition: "Chuvoso", high_c: 10, low_c: 7 },
    { day: "Depois de amanhã", condition: "Nublado", high_c: 12, low_c: 8 },
    { day: "Em 3 dias", condition: "Ensolarado", high_c: 14, low_c: 9 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toFahrenheit(c: number) {
  return Math.round(c * 1.8 + 32);
}

function conditionEmoji(condition: Condition) {
  const map: Record<Condition, string> = {
    Ensolarado: "☀️",
    Nublado: "☁️",
    Chuvoso: "🌧️",
    Tempestuoso: "⛈️",
    Nevando: "❄️",
  };
  return map[condition] ?? "🌡️";
}

function formatWeather(w: WeatherData, unit: "celsius" | "fahrenheit") {
  const temp =
    unit === "fahrenheit"
      ? `${toFahrenheit(w.temperature_c)}°F (sensação ${toFahrenheit(w.feels_like_c)}°F)`
      : `${w.temperature_c}°C (sensação ${w.feels_like_c}°C)`;

  return [
    `${conditionEmoji(w.condition)} **${w.city}, ${w.country}**`,
    `Condição: ${w.condition}`,
    `Temperatura: ${temp}`,
    `Umidade: ${w.humidity_percent}%`,
    `Vento: ${w.wind_kph} km/h`,
    `Índice UV: ${w.uv_index}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Servidor MCP
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "dummy-weather",
  version: "1.0.0",
  description: "Servidor MCP de clima fictício para fins didáticos",
});

// ---------------------------------------------------------------------------
// TOOL 1 — get_current_weather
// Busca o clima atual de uma cidade.
// ---------------------------------------------------------------------------
server.registerTool(
  "get_current_weather",
  {
    description: "Retorna o clima atual de uma cidade. Dados são fictícios.",
    inputSchema: {
      city: z.string().describe("Nome da cidade (ex: São Paulo, Tokyo, London)"),
      unit: z
        .enum(["celsius", "fahrenheit"])
        .default("celsius")
        .describe("Unidade de temperatura"),
    },
  },
  async ({ city, unit }) => {
    const key = city.toLowerCase();
    const weather = WEATHER_DB[key];

    if (!weather) {
      const available = Object.values(WEATHER_DB)
        .map((w) => w.city)
        .join(", ");
      return {
        content: [
          {
            type: "text",
            text: `❌ Cidade "${city}" não encontrada.\nCidades disponíveis: ${available}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [{ type: "text", text: formatWeather(weather, unit) }],
    };
  }
);

// ---------------------------------------------------------------------------
// TOOL 2 — get_forecast
// Previsão para os próximos 3 dias.
// ---------------------------------------------------------------------------
server.registerTool(
  "get_forecast",
  {
    description: "Retorna a previsão do tempo para os próximos 3 dias de uma cidade. Dados são fictícios.",
    inputSchema: {
      city: z.string().describe("Nome da cidade"),
    },
  },
  async ({ city }) => {
    const key = city.toLowerCase();
    const forecast = FORECAST_DB[key];

    if (!forecast) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Previsão não disponível para "${city}".`,
          },
        ],
        isError: true,
      };
    }

    const lines = forecast.map(
      (f) =>
        `${conditionEmoji(f.condition)} **${f.day}** — ${f.condition}, máx ${f.high_c}°C / mín ${f.low_c}°C`
    );

    return {
      content: [
        {
          type: "text",
          text: [`📅 Previsão para ${city}:`, ...lines].join("\n"),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// TOOL 3 — compare_weather
// Compara o clima entre duas cidades.
// ---------------------------------------------------------------------------
server.registerTool(
  "compare_weather",
  {
    description: "Compara o clima atual entre duas cidades.",
    inputSchema: {
      city_a: z.string().describe("Primeira cidade"),
      city_b: z.string().describe("Segunda cidade"),
    },
  },
  async ({ city_a, city_b }) => {
    const a = WEATHER_DB[city_a.toLowerCase()];
    const b = WEATHER_DB[city_b.toLowerCase()];

    if (!a || !b) {
      return {
        content: [{ type: "text", text: "❌ Uma ou ambas as cidades não foram encontradas." }],
        isError: true,
      };
    }

    const warmer = a.temperature_c >= b.temperature_c ? a.city : b.city;
    const diff = Math.abs(a.temperature_c - b.temperature_c);

    return {
      content: [
        {
          type: "text",
          text: [
            `🔁 **Comparação: ${a.city} vs ${b.city}**`,
            ``,
            formatWeather(a, "celsius"),
            ``,
            formatWeather(b, "celsius"),
            ``,
            `📊 ${warmer} está ${diff}°C mais quente.`,
          ].join("\n"),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// RESOURCE — weather://cities
// Lista todas as cidades disponíveis no banco de dados fictício.
// ---------------------------------------------------------------------------
server.registerResource(
  "weather-cities",
  "weather://cities",
  {
    description: "Lista de cidades disponíveis no servidor de clima",
    mimeType: "application/json",
  },
  async () => ({
    contents: [
      {
        uri: "weather://cities",
        mimeType: "application/json",
        text: JSON.stringify(
          Object.values(WEATHER_DB).map(({ city, country, condition }) => ({
            city,
            country,
            current_condition: condition,
          })),
          null,
          2
        ),
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// PROMPT — weather-report
// Template para pedir um relatório de clima formatado.
// ---------------------------------------------------------------------------
server.registerPrompt(
  "weather-report",
  {
    description: "Gera um relatório completo de clima para uma cidade, incluindo clima atual e previsão.",
    argsSchema: { city: z.string().describe("Nome da cidade para o relatório") },
  },
  async ({ city }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Por favor, use as ferramentas disponíveis para montar um relatório completo de clima para ${city}. Inclua: clima atual (em Celsius e Fahrenheit) e previsão para os próximos 3 dias. Formate de forma clara e amigável.`,
        },
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // ⚠️ Sempre use console.error em servidores stdio — console.log corrompe o protocolo JSON-RPC
  console.error("[dummy-weather] Servidor MCP rodando via stdio");
}

main().catch((err) => {
  console.error("[dummy-weather] Erro fatal:", err);
  process.exit(1);
});
