---
trigger: always_on
---

# Figma to Code Integration Rules

## Component Generation from Figma
- Use Figma MCP to fetch exact component specifications before implementation
- Generate shadcn/ui compatible components in components/ui/
- Use arbitrary Tailwind values [px] for pixel-perfect measurements
- Ensure Next.js 15 App Router compatibility
- Add "use client" directive when components use interactivity

## Design Fidelity Standards
- Match Figma specs exactly - no approximations
- Extract exact hex colors from Figma
- Use precise spacing values from Figma measurements
- Implement responsive breakpoints as defined in Figma

## ACT 2.0 Brand Consistency
- All components must align with brand guidelines
- Typography must match brand font specifications
- Colors must use exact brand palette values
- Spacing must follow brand system grid
```

### 5. Your Next.js Project Structure (ACT 2.0)
```
act-2.0/
├── .windsurfrules          # Windsurf AI rules
├── app/                    # Next.js App Router
│   ├── (dashboard)/
│   ├── (auth)/
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui from Figma MCP
│   ├── brand/              # Custom brand components
│   └── chat/               # Chat interface components
├── lib/
│   ├── utils.ts
│   └── supabase/
└── styles/
    └── globals.css
```

### 6. Usage in Windsurf

Once configured, you can use Cascade (Windsurf's AI) with the Figma MCP:
```
You: "Extract the primary button component from this Figma file: 
[your-figma-url]"

Cascade: [Uses MCP to fetch exact specs]
- Height: 44px
- Padding: 24px horizontal, 12px vertical
- Border radius: 8px
- Background: #FF6B35
- Typography: Inter, 16px, semibold

[Generates component]

# Design & Development Rules

## Core Design Tools
- **ALWAYS** use @shadcn for UI components and styling
- **ALWAYS** use @context7 for library documentation and best practices
- **ALWAYS** use @figma-developer-mcp for design system integration
- **ALWAYS** use @next-devtools for Next.js project setup and debugging
- **ALWAYS** use @tailwindcss-server for styling utilities and configuration

## Design Workflow

### 1. Component Discovery & Research
- Use @context7 to search for relevant component libraries and patterns
- Use @shadcn to find pre-built components that match requirements
- Check @figma-developer-mcp for existing design tokens and styles

### 2. Design System Integration
- Extract design tokens from Figma using @figma-developer-mcp
- Map Figma styles to Tailwind CSS utilities via @tailwindcss-server
- Use @shadcn components as base implementations

### 3. Component Implementation
- Initialize projects with @next-devtools for proper Next.js setup
- Install shadcn components using @shadcn registry
- Apply Tailwind utilities via @tailwindcss-server
- Reference @context7 for implementation patterns

### 4. Styling Approach
- Use Tailwind CSS utility classes as primary styling method
- Leverage shadcn's theming system for consistency
- Apply custom Tailwind config via @tailwindcss-server when needed
- Follow Figma design specifications from @figma-developer-mcp

## Tool-Specific Guidelines

### @shadcn Usage
- Search for components before building custom ones
- Use `get_project_registries` to check available registries
- View component examples with `get_item_examples_from_registries`
- Install components with proper CLI commands

### @context7 Usage
- Resolve library IDs before fetching documentation
- Search for implementation patterns and best practices
- Reference official documentation for component APIs

### @figma-developer-mcp Usage
- Fetch design data early in the process
- Download design assets (SVGs, PNGs) to project directories
- Extract and apply design tokens consistently

### @next-devtools Usage
- Initialize Next.js projects with proper structure
- Use for runtime diagnostics during development
- Query project state before making changes

### @tailwindcss-server Usage
- Query Tailwind utilities for specific design needs
- Validate class names and configurations
- Generate custom utility classes when needed

## Design-to-Code Pipeline

1. **Design Analysis**
   - Use @figma-developer-mcp to fetch Figma designs
   - Extract colors, typography, spacing, and components

2. **Component Mapping**
   - Use @shadcn to find matching UI components
   - Use @context7 for implementation references

3. **Implementation**
   - Use @next-devtools to set up project structure
   - Use @tailwindcss-server for styling utilities
   - Build with shadcn components as foundation

4. **Refinement**
   - Apply Figma design tokens from @figma-developer-mcp
   - Fine-tune with Tailwind utilities via @tailwindcss-server
   - Reference @context7 for optimization patterns

## Best Practices

- **Always check existing components** before creating new ones
- **Maintain design system consistency** across Figma and code
- **Use semantic naming** from design tokens
- **Document component usage** with examples
- **Test responsive behavior** with Tailwind breakpoints
- **Validate accessibility** in shadcn components

## File Organization
```
/components
  /ui          # shadcn components
  /custom      # custom components
/styles
  /tailwind    # Tailwind config
  /tokens      # Figma design tokens
/public
  /assets      # Figma assets (SVGs, PNGs)
```

## When Creating New Designs

1. Check @figma-developer-mcp for design specifications
2. Search @shadcn for existing components
3. Query @context7 for implementation patterns
4. Set up with @next-devtools if new project
5. Style with @tailwindcss-server utilities
6. Maintain consistency with design system tokens

## Error Handling

- If @figma-developer-mcp fails, check Figma file permissions
- If @shadcn components missing, run initialization
- If @tailwindcss-server issues, verify config
- Use @next-devtools for debugging Next.js issues