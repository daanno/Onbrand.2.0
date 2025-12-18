"use client";

import { MessageSquare, Image as ImageIcon, FileText, Zap } from "lucide-react";

interface StatsData {
  promptTokensUsed?: number;
  promptTokensLimit?: number;
  imageGenerationUsed?: number;
  imageGenerationLimit?: number;
  contentCount?: number;
  workflowsUsed?: number;
  workflowsLimit?: number;
}

interface StatsCardsProps {
  data?: StatsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const statsData = [
    {
      title: "Chat Tokens",
      value: data?.promptTokensUsed?.toLocaleString() || "0",
      limit: data?.promptTokensLimit?.toLocaleString() || "100,000",
      change: data?.promptTokensUsed && data?.promptTokensLimit 
        ? `${Math.round((data.promptTokensUsed / data.promptTokensLimit) * 100)}%`
        : "0%",
      changeLabel: "used",
      isPositive: (data?.promptTokensUsed || 0) < (data?.promptTokensLimit || 1) * 0.8,
      icon: MessageSquare,
    },
    {
      title: "Images Generated",
      value: data?.imageGenerationUsed?.toString() || "0",
      limit: data?.imageGenerationLimit?.toString() || "50",
      change: data?.imageGenerationUsed && data?.imageGenerationLimit
        ? `${Math.round((data.imageGenerationUsed / data.imageGenerationLimit) * 100)}%`
        : "0%",
      changeLabel: "used",
      isPositive: (data?.imageGenerationUsed || 0) < (data?.imageGenerationLimit || 1) * 0.8,
      icon: ImageIcon,
    },
    {
      title: "Content Created",
      value: data?.contentCount?.toString() || "0",
      limit: null,
      change: "+12%",
      changeLabel: "this month",
      isPositive: true,
      icon: FileText,
    },
    {
      title: "Workflows Run",
      value: data?.workflowsUsed?.toString() || "0",
      limit: data?.workflowsLimit?.toString() || "100",
      change: data?.workflowsUsed && data?.workflowsLimit
        ? `${Math.round((data.workflowsUsed / data.workflowsLimit) * 100)}%`
        : "0%",
      changeLabel: "used",
      isPositive: (data?.workflowsUsed || 0) < (data?.workflowsLimit || 1) * 0.8,
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card overflow-hidden">
      {statsData.map((stat, index) => (
        <div key={stat.title} className="flex items-start">
          <div className="flex-1 space-y-2 sm:space-y-4 lg:space-y-6">
            <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
              <stat.icon className="size-3.5 sm:size-[18px]" />
              <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                {stat.title}
              </span>
            </div>
            <div>
              <p className="text-lg sm:text-xl lg:text-[28px] font-semibold leading-tight tracking-tight">
                {stat.value}
              </p>
              {stat.limit && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  of {stat.limit}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-medium">
              <span
                className={stat.isPositive ? "text-emerald-600" : "text-amber-600"}
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground hidden sm:inline">
                {stat.changeLabel}
              </span>
            </div>
          </div>
          {index < statsData.length - 1 && (
            <div className="hidden lg:block w-px h-full bg-border mx-4 xl:mx-6" />
          )}
        </div>
      ))}
    </div>
  );
}
