# MCP Servers Guide for ACT 2.0

## Overview

Model Context Protocol (MCP) servers extend AI capabilities by providing access to specialized tools, external services, and data sources. This guide documents the MCP servers configured for the ACT 2.0 project.

---

## Essential MCP Servers

### 1. **@shadcn** - UI Component Library
**Purpose**: Access to shadcn/ui component registry for building consistent UI components.

**Key Features**:
- Search and discover pre-built components
- View component examples and implementations
- Get CLI commands for component installation
- Access component documentation

**Common Tools**:
- `search_items_in_registries` - Find components by name/description
- `view_items_in_registries` - View detailed component code
- `get_item_examples_from_registries` - Get usage examples
- `get_add_command_for_items` - Get installation commands

**Usage Example**:
```typescript
// Search for button components
@shadcn search_items_in_registries query="button"

// View button component details
@shadcn view_items_in_registries items=["@shadcn/button"]

// Get installation command
@shadcn get_add_command_for_items items=["@shadcn/button"]
```

---

### 2. **@figma-developer-mcp** - Design System Integration
**Purpose**: Extract design specifications, assets, and tokens from Figma files.

**Key Features**:
- Fetch Figma file data (layouts, colors, typography)
- Download design assets (SVGs, PNGs)
- Extract design tokens for code implementation
- Get component specifications

**Common Tools**:
- `get_figma_data` - Fetch complete Figma file structure
- `download_figma_images` - Download image assets

**Usage Example**:
```typescript
// Extract design data from Figma
@figma-developer-mcp get_figma_data fileKey="your-figma-file-key"

// Download component images
@figma-developer-mcp download_figma_images 
  fileKey="your-file-key" 
  localPath="/path/to/assets"
  nodes=[{nodeId: "123:456", fileName: "icon.svg"}]
```

**Required Setup**:
- Figma Personal Access Token
- Configure in Windsurf MCP settings

---

### 3. **@context7** - Library Documentation
**Purpose**: Retrieve up-to-date documentation and code examples for any library.

**Key Features**:
- Search library documentation
- Get API references and code examples
- Access conceptual guides
- Find implementation patterns

**Common Tools**:
- `resolve-library-id` - Find library ID (call this first)
- `get-library-docs` - Fetch documentation

**Usage Example**:
```typescript
// First, resolve the library ID
@context7 resolve-library-id libraryName="next.js"

// Then get documentation
@context7 get-library-docs 
  context7CompatibleLibraryID="/vercel/next.js"
  topic="routing"
  mode="code"
```

**Modes**:
- `mode='code'` - API references and code examples (default)
- `mode='info'` - Conceptual guides and architecture

---

### 4. **@next-devtools** - Next.js Development Tools
**Purpose**: Next.js project setup, debugging, and runtime diagnostics.

**Key Features**:
- Initialize Next.js projects
- Query runtime state and errors
- Access MCP tools from Next.js dev server
- Upgrade to Next.js 16
- Enable Cache Components mode

**Common Tools**:
- `init` - Initialize Next.js DevTools context
- `nextjs_index` - Discover running dev servers and tools
- `nextjs_call` - Call specific MCP tools on dev server
- `nextjs_docs` - Search Next.js documentation
- `upgrade_nextjs_16` - Upgrade to Next.js 16
- `enable_cache_components` - Migrate to Cache Components

**Usage Example**:
```typescript
// Initialize DevTools
@next-devtools init project_path="/path/to/project"

// Discover running servers
@next-devtools nextjs_index

// Call a tool on the dev server
@next-devtools nextjs_call 
  port="3000" 
  toolName="get_errors"
```

**Requirements**:
- Next.js 16+ for MCP support
- Dev server must be running

---

### 5. **@tailwindcss-server** - Tailwind CSS Utilities
**Purpose**: Access Tailwind CSS utilities, configuration, and styling tools.

**Key Features**:
- Query Tailwind utility classes
- Convert CSS to Tailwind classes
- Generate color palettes
- Get framework-specific installation guides
- Generate component templates

**Common Tools**:
- `get_tailwind_utilities` - Search utilities by category/property
- `convert_css_to_tailwind` - Convert CSS to Tailwind classes
- `generate_color_palette` - Create custom color palettes
- `install_tailwind` - Get installation commands
- `generate_component_template` - Generate component templates

**Usage Example**:
```typescript
// Search for layout utilities
@tailwindcss-server get_tailwind_utilities category="layout"

// Convert CSS to Tailwind
@tailwindcss-server convert_css_to_tailwind 
  css="display: flex; justify-content: center;"
  mode="classes"

// Generate color palette
@tailwindcss-server generate_color_palette 
  baseColor="#FF6B35"
  name="brand"
```

---

## Additional MCP Servers

### 6. **@supabase** - Supabase Database Management
**Purpose**: Manage Supabase projects, databases, and edge functions.

**Key Features**:
- Execute SQL queries
- Apply migrations
- Manage projects and branches
- Deploy edge functions
- Generate TypeScript types

**Common Tools**:
- `list_projects` - List all Supabase projects
- `execute_sql` - Run SQL queries
- `apply_migration` - Apply database migrations
- `generate_typescript_types` - Generate types from schema

---

### 7. **@playwright** - Browser Automation
**Purpose**: Automate browser testing and interactions.

**Key Features**:
- Navigate and interact with web pages
- Take screenshots
- Fill forms and click elements
- Capture console messages
- Test responsive designs

**Common Tools**:
- `browser_navigate` - Navigate to URL
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_take_screenshot` - Capture screenshots
- `browser_snapshot` - Get accessibility snapshot

---

### 8. **@airtable** - Airtable Integration
**Purpose**: Manage Airtable bases, tables, and records.

**Key Features**:
- List bases and tables
- Create/read/update/delete records
- Search records
- Manage fields and schemas

---

## MCP Server Configuration

### Windsurf Configuration File
Location: `~/.codeium/windsurf/mcp_settings.json`

**Example Configuration**:
```json
{
  "mcpServers": {
    "figma-developer-mcp": {
      "command": "npx",
      "args": ["-y", "@figma-mcp/server"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

---

## Workflow Integration

### Design-to-Code Pipeline

1. **Design Analysis** (@figma-developer-mcp)
   - Fetch Figma designs
   - Extract colors, typography, spacing

2. **Component Mapping** (@shadcn, @context7)
   - Find matching UI components
   - Get implementation references

3. **Implementation** (@next-devtools, @tailwindcss-server)
   - Set up project structure
   - Apply styling utilities
   - Build with shadcn components

4. **Testing** (@playwright)
   - Automate browser testing
   - Verify responsive behavior
   - Capture screenshots

---

## Best Practices

### When to Use Each Server

**@shadcn**:
- Building new UI components
- Need pre-built, accessible components
- Want consistent design system

**@figma-developer-mcp**:
- Implementing designs from Figma
- Need exact design specifications
- Extracting design tokens

**@context7**:
- Learning new libraries
- Need up-to-date documentation
- Looking for implementation patterns

**@next-devtools**:
- Debugging Next.js applications
- Setting up new Next.js projects
- Querying runtime state

**@tailwindcss-server**:
- Styling components
- Converting CSS to Tailwind
- Generating color palettes

**@supabase**:
- Database operations
- Managing migrations
- Deploying edge functions

**@playwright**:
- End-to-end testing
- Browser automation
- Visual regression testing

---

## Troubleshooting

### Common Issues

**MCP Server Not Available**:
- Check Windsurf MCP settings
- Verify API tokens are configured
- Restart Windsurf IDE

**Figma Access Issues**:
- Verify Personal Access Token
- Check Figma file permissions
- Ensure file key is correct

**Next.js MCP Not Working**:
- Ensure Next.js 16+ is installed
- Verify dev server is running
- Check port number is correct

**Supabase Connection Issues**:
- Verify access token
- Check project ID
- Ensure network connectivity

---

## Quick Reference

### Most Used Commands

```bash
# Search for components
@shadcn search_items_in_registries query="button"

# Get Figma design data
@figma-developer-mcp get_figma_data fileKey="abc123"

# Get library documentation
@context7 get-library-docs context7CompatibleLibraryID="/vercel/next.js"

# Initialize Next.js DevTools
@next-devtools init project_path="."

# Convert CSS to Tailwind
@tailwindcss-server convert_css_to_tailwind css="..."

# Execute SQL
@supabase execute_sql project_id="..." query="..."

# Navigate browser
@playwright browser_navigate url="http://localhost:3000"
```

---

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Playwright Documentation](https://playwright.dev/)

---

## Notes

- Always call `@context7 resolve-library-id` before `get-library-docs`
- Use `@next-devtools init` at the start of Next.js sessions
- Check `@figma-developer-mcp` for design specs before implementing
- Use `@shadcn` components as base implementations
- Apply `@tailwindcss-server` utilities for styling
- Test with `@playwright` for end-to-end validation

---

**Last Updated**: November 28, 2025
**Project**: ACT 2.0
**Maintainer**: Development Team
