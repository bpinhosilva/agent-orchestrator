import { Type } from '@nestjs/common';
import { Agent } from '../interfaces/agent.interface';

export const AGENT_REGISTRY = new Map<string, Type<Agent>>();

/**
 * Decorator to register an agent implementation for a specific provider.
 * @param provider The name of the AI provider (e.g., 'Google', 'OpenAI').
 */
export function RegisterAgent(provider: string) {
  return (target: Type<Agent>) => {
    AGENT_REGISTRY.set(provider, target);
  };
}

/**
 * Helper to get the implementation class for a provider.
 * @param provider The provider name.
 */
export function getAgentImplementation(
  provider: string,
): Type<Agent> | undefined {
  return AGENT_REGISTRY.get(provider);
}
