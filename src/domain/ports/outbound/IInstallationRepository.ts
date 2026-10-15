import { Installation } from '../../model/Installation';

export interface IInstallationRepository {
  save(installation: Installation): Promise<void>;
  findById(installationId: string): Promise<Installation | null>;
  findAll(): Promise<Installation[]>;
}
