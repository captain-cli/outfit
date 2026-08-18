export interface RegistryDigest {
  algorithm: "sha256";
  value: string;
}

export interface RegistrySigningMetadata {
  required: boolean;
}

export interface RegistryReleaseManifest {
  version: string;
  schemaVersion: string;
  registryFile: string;
  digest: RegistryDigest;
  signing: RegistrySigningMetadata;
}
