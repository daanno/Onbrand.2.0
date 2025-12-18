"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, MessageSquare, Image as ImageIcon, FileText } from "lucide-react";
import Link from "next/link";

interface WelcomeSectionProps {
  userName?: string;
  stats?: {
    newChats?: number;
    pendingTasks?: number;
  };
}

export function WelcomeSection({ userName, stats }: WelcomeSectionProps) {
  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
      <div className="space-y-2 sm:space-y-5">
        <h2 className="text-lg sm:text-[22px] font-semibold leading-relaxed">
          Welcome Back, {firstName}!
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {stats?.newChats ? (
            <>
              You have{" "}
              <span className="text-foreground font-medium">
                {stats.newChats} recent chat{stats.newChats !== 1 ? 's' : ''}
              </span>
              {stats?.pendingTasks ? (
                <>
                  ,{" "}
                  <span className="text-foreground font-medium">
                    {stats.pendingTasks} pending task{stats.pendingTasks !== 1 ? 's' : ''}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            "Ready to create something amazing today?"
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm">
              <span className="hidden xs:inline">Quick Actions</span>
              <span className="xs:hidden">Actions</span>
              <ChevronDown className="size-3 sm:size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/chat">
                <MessageSquare className="size-4 mr-2" />
                Start Chat
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/images">
                <ImageIcon className="size-4 mr-2" />
                Generate Image
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/content">
                <FileText className="size-4 mr-2" />
                Create Content
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          asChild
        >
          <Link href="/chat">
            <Plus className="size-3 sm:size-4" />
            <span className="hidden xs:inline">New Chat</span>
            <span className="xs:hidden">New</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
