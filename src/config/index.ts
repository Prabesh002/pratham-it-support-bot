import dotenv from 'dotenv';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

import { toError } from '@/utils/ErrorUtils';
import { IBotConfig } from '@/core/interfaces/IBotConfig';

dotenv.config();

const envSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIRECTORY: z.string().default('logs'),
  AI_API_BASE_URL: z.string().url(),
  AI_API_USERNAME: z.string().min(1),
  AI_API_PASSWORD: z.string().min(1),
  WEB_APP_URL: z.string().url(),
  WEB_SERVER_PORT: z.string().default('8080'),
  CRM_API_BASE_URL: z.string().url()
});

const botConfigSchema = z.object({
  id: z.string().min(1),
  tokenEnvVar: z.string().min(1),
  description: z.string(),
  enabledFeatures: z.array(z.string()),
});

const botsConfigSchema = z.array(botConfigSchema);

export class Config {
  public readonly logLevel: 'error' | 'warn' | 'info' | 'debug';
  public readonly logDirectory: string;
  public readonly aiApiBaseUrl: string;
  public readonly aiApiUsername: string;
  public readonly aiApiPassword: string;
  public readonly webAppUrl: string;
  public readonly webServerPort: string;
  public readonly crmApiBaseUrl: string;

  private botConfigs: IBotConfig[] = [];

  constructor() {
    const parsedEnv = envSchema.safeParse(process.env);
    if (!parsedEnv.success) {
      console.error(
        'Invalid environment variables:',
        parsedEnv.error.flatten().fieldErrors,
      );
      throw new Error('Invalid environment variables.');
    }
    const env = parsedEnv.data;
    this.logLevel = env.LOG_LEVEL;
    this.logDirectory = env.LOG_DIRECTORY;
    this.aiApiBaseUrl = env.AI_API_BASE_URL;
    this.aiApiUsername = env.AI_API_USERNAME;
    this.aiApiPassword = env.AI_API_PASSWORD;
    this.webAppUrl = env.WEB_APP_URL;
    this.webServerPort = env.WEB_SERVER_PORT;
    this.crmApiBaseUrl = env.CRM_API_BASE_URL; 
  }

  public async loadBotConfigs(): Promise<void> {
    try {
      const configPath = path.join(__dirname, './bots.config.json');
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const rawConfigs = JSON.parse(fileContent);
      const validatedConfigs = botsConfigSchema.parse(rawConfigs);

      this.botConfigs = validatedConfigs.map(c => {
        const token = process.env[c.tokenEnvVar];
        if (!token) {
          throw new Error(`Environment variable ${c.tokenEnvVar} for bot ${c.id} is not set.`);
        }
        return { ...c, token };
      });
    } catch (e) {
      const error = toError(e);
      console.error(`Fatal: Could not load or parse bots.config.json: ${error.message}`);
      throw error;
    }
  }

  public getBotConfigs(): IBotConfig[] {
    return this.botConfigs;
  }
}