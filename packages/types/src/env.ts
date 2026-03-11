export type KhufusEnv = "local" | "prod";

export interface AppEnvironment {
  supabase: {
    url: string;
    auth_cookie_domain: string;
  };
  home_assistant: {
    url: string;
    websocket_url: string;
  };
  mqtt: {
    host: string;
    port: number;
  };
  apps: {
    dashboard_url: string;
    threedimension_url: string;
    finance_url: string;
  };
  features: {
    mock_devices: boolean;
    seed_data: boolean;
  };
}
