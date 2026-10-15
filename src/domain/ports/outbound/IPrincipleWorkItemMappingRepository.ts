import { PrincipleWorkItemMapping } from '../../model/PrincipleWorkItemMapping';

export interface IPrincipleWorkItemMappingRepository {
  save(entry: PrincipleWorkItemMapping): Promise<void>;
  delete(principleId: string, installationId: string, workItemId: string): Promise<void>;
  findByIssue(principleId: string, installationId: string, workItemId: string): Promise<PrincipleWorkItemMapping | null>;
  findAllByPrincipleAndInstallation(principleId: string, installationId: string): Promise<PrincipleWorkItemMapping[]>;
  findAllByWorkItem(installationId: string, workItemId: string): Promise<PrincipleWorkItemMapping[]>;
}
