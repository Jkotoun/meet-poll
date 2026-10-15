export enum IdentityProvider {
  Password = 'password',
  Google = 'google',
}

export interface IdentityProps {
  id: string;
  userId: string;
  provider: IdentityProvider;
  providerSubject: string | null;
  passwordHash: string | null;
  createdAt: Date;
}

export class Identity {
  readonly id: string;
  readonly userId: string;
  readonly provider: IdentityProvider;
  readonly providerSubject: string | null;
  readonly passwordHash: string | null;
  readonly createdAt: Date;

  constructor(props: IdentityProps) {
    assertCredentialsMatchProvider(props);
    this.id = props.id;
    this.userId = props.userId;
    this.provider = props.provider;
    this.providerSubject = props.providerSubject;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt;
  }

  static password(userId: string, passwordHash: string, now: Date): Identity {
    return new Identity({
      id: Bun.randomUUIDv7(),
      userId,
      provider: IdentityProvider.Password,
      providerSubject: null,
      passwordHash,
      createdAt: now,
    });
  }
}

function assertCredentialsMatchProvider({
  provider,
  providerSubject,
  passwordHash,
}: IdentityProps): void {
  const valid =
    provider === IdentityProvider.Password
      ? passwordHash !== null && providerSubject === null
      : providerSubject !== null && passwordHash === null;
  if (!valid) {
    throw new Error(`Invalid credentials for a ${provider} identity`);
  }
}
