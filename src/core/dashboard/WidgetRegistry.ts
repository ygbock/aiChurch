import React from 'react';

export interface WidgetDefinition {
  id: string; // e.g., 'finance.donations_summary'
  workspace: string; // e.g., 'finance', 'admin', 'membership'
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
  title: string;
  permissions?: string[];
  featureFlag?: string;
  size?: 'small' | 'medium' | 'large' | 'full'; 
}

class DashboardWidgetRegistry {
  private static instance: DashboardWidgetRegistry;
  private widgets: Map<string, WidgetDefinition> = new Map();

  private constructor() {}

  public static getInstance(): DashboardWidgetRegistry {
    if (!DashboardWidgetRegistry.instance) {
      DashboardWidgetRegistry.instance = new DashboardWidgetRegistry();
    }
    return DashboardWidgetRegistry.instance;
  }

  public registerWidget(definition: WidgetDefinition): void {
    if (this.widgets.has(definition.id)) {
        console.warn(`[DashboardRegistry] Widget with id ${definition.id} is already registered. Overwriting.`);
    }
    this.widgets.set(definition.id, definition);
  }

  public getWidgetsForWorkspace(workspaceName: string): WidgetDefinition[] {
    const result: WidgetDefinition[] = [];
    for (const widget of this.widgets.values()) {
        if (widget.workspace === workspaceName) {
            result.push(widget);
        }
    }
    return result;
  }

  public getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
}

export const widgetRegistry = DashboardWidgetRegistry.getInstance();
