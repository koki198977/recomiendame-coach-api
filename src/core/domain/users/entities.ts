export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  constructor(public readonly props: UserProps) {}
  get id() { return this.props.id; }
  get email() { return this.props.email; }
}
