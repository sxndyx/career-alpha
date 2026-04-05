export interface AuthProvider {
  name: string;
  label: string;
  enabled: boolean;
}

export const replitProvider: AuthProvider = {
  name: "replit",
  label: "Replit",
  enabled: true,
};

export const linkedInProvider: AuthProvider = {
  name: "linkedin",
  label: "LinkedIn",
  enabled: false,
};

export const allProviders: AuthProvider[] = [replitProvider, linkedInProvider];

export function getEnabledProviders(): AuthProvider[] {
  return allProviders.filter((p) => p.enabled);
}
