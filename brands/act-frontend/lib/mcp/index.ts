// MCP (Model Context Protocol) Integration
// NOTE: Do NOT export directly from client-manager.ts as it imports @ai-sdk/mcp
// which causes DOMMatrix errors during build. Use createMCPManager instead.
export * from './types';
export { createMCPManager, isMCPAvailable, type IMCPClientManager } from './client-manager-loader';
export { useMCPServers } from './use-mcp-servers';
