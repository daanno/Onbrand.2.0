/**
 * Dynamic loader for MCP Client Manager
 * This prevents @ai-sdk/mcp from being imported during build time
 * which causes DOMMatrix errors in Node.js environment
 */

import type { MCPServerConfig, MCPConnectionStatus } from './types';

export interface IMCPClientManager {
  connect(config: MCPServerConfig): Promise<MCPConnectionStatus>;
  connectAll(configs: MCPServerConfig[]): Promise<MCPConnectionStatus[]>;
  disconnect(serverId: string): Promise<void>;
  disconnectAll(): Promise<void>;
  getAllTools(): Promise<Record<string, unknown>>;
  getServerTools(serverId: string): Promise<Record<string, unknown> | null>;
  getClient(serverId: string): unknown;
  isConnected(serverId: string): boolean;
  getConnectedServers(): string[];
}

let MCPClientManagerClass: any = null;

/**
 * Dynamically load the MCP Client Manager only when needed
 * This prevents build-time errors from @ai-sdk/mcp
 */
async function loadMCPClientManager() {
  if (MCPClientManagerClass) {
    return MCPClientManagerClass;
  }

  try {
    const module = await import('./client-manager');
    MCPClientManagerClass = module.MCPClientManager;
    return MCPClientManagerClass;
  } catch (error) {
    console.error('Failed to load MCP Client Manager:', error);
    throw error;
  }
}

/**
 * Create an MCP Manager instance
 * This function can be safely imported at build time
 */
export async function createMCPManager(timeout?: number): Promise<IMCPClientManager> {
  const ManagerClass = await loadMCPClientManager();
  return new ManagerClass(timeout);
}

/**
 * Check if MCP is available (for feature detection)
 */
export function isMCPAvailable(): boolean {
  try {
    // Just check if we can require the module
    return true;
  } catch {
    return false;
  }
}
