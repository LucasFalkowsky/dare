import { Injectable } from '@nestjs/common';
import { IPrincipleInheritancePort } from '../../../domain/ports/outbound/IPrincipleInheritancePort';
import { Installation } from '../../../domain/model/Installation';

const UNSUPPORTED =
  'Principle inheritance is not available on GitLab: its REST v4 API exposes no work-item ' +
  'hierarchy and its webhook payloads carry no parent, so parents and children cannot be ' +
  'resolved without GraphQL.';

/**
 * Deliberate no-op binding for platforms without a usable work-item hierarchy.
 *
 * `supported: false` makes callers skip inheritance entirely, so the throwing
 * methods are unreachable in normal operation — they exist so that a caller
 * which ignores the flag fails loudly instead of silently doing nothing.
 */
@Injectable()
export class StubPrincipleInheritanceAdapter implements IPrincipleInheritancePort {
  readonly supported = false;

  async getPrinciples(installation: Installation, workItemId: string): Promise<string[]> {
    throw new Error(`${UNSUPPORTED} (getPrinciples #${workItemId} on ${installation.platform})`);
  }

  async addPrinciples(installation: Installation, workItemId: string): Promise<void> {
    throw new Error(`${UNSUPPORTED} (addPrinciples #${workItemId} on ${installation.platform})`);
  }

  async findChildWorkItems(installation: Installation, workItemId: string): Promise<string[]> {
    throw new Error(`${UNSUPPORTED} (findChildWorkItems #${workItemId} on ${installation.platform})`);
  }
}
