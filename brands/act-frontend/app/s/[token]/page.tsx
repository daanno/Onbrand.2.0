'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lock, MessageSquare, Folder } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  model?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  conversations: Conversation[];
}

type ResourceData = Conversation | Project;

export default function SharedResourcePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [resourceType, setResourceType] = useState<'conversation' | 'project' | null>(null);
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSharedResource();
    }
  }, [token]);

  const fetchSharedResource = async (passwordAttempt?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/share', window.location.origin);
      url.searchParams.set('token', token);
      if (passwordAttempt) {
        url.searchParams.set('password', passwordAttempt);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.requiresPassword) {
          setRequiresPassword(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to load shared resource');
      }

      setResourceType(data.resourceType);
      setResourceData(data.resourceData);
      setBrandId(data.brandId);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSharedResource(password);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading shared content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unable to Load
            </CardTitle>
            <CardDescription>This shared link is not available</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This link may have:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Expired</li>
                <li>Been revoked</li>
                <li>Reached its view limit</li>
                <li>Never existed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPassword && !resourceData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </CardTitle>
            <CardDescription>This shared content is password protected</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full">
                Unlock
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!resourceData) {
    return null;
  }

  // Render conversation
  if (resourceType === 'conversation') {
    const conversation = resourceData as Conversation;
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">{conversation.title}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared conversation · {new Date(conversation.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-6">
            {conversation.messages && conversation.messages.length > 0 ? (
              conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary/10 ml-8'
                      : message.role === 'assistant'
                      ? 'bg-muted mr-8'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {message.role === 'user' ? 'User' : message.role === 'assistant' ? 'Assistant' : 'System'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </div>
                  {message.model && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Model: {message.model}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                No messages in this conversation
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 text-center text-sm text-muted-foreground">
            This is a read-only view of a shared conversation
          </div>
        </div>
      </div>
    );
  }

  // Render project
  if (resourceType === 'project') {
    const project = resourceData as Project;
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">{project.name}</h1>
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              Shared project · {new Date(project.created_at).toLocaleDateString()} · {project.conversations?.length || 0} conversations
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-8">
          {project.conversations && project.conversations.length > 0 ? (
            <div className="space-y-8">
              {project.conversations.map((conversation) => (
                <Card key={conversation.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {conversation.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {conversation.messages && conversation.messages.length > 0 ? (
                        conversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`rounded-lg p-3 text-sm ${
                              message.role === 'user'
                                ? 'bg-primary/10'
                                : message.role === 'assistant'
                                ? 'bg-muted'
                                : 'bg-muted/50'
                            }`}
                          >
                            <div className="mb-1 font-medium capitalize">
                              {message.role === 'user' ? 'User' : message.role === 'assistant' ? 'Assistant' : 'System'}
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {message.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-sm text-muted-foreground">
                          No messages
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No conversations in this project
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 text-center text-sm text-muted-foreground">
            This is a read-only view of a shared project
          </div>
        </div>
      </div>
    );
  }

  return null;
}

