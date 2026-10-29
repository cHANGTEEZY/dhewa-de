export type PublicUser = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};
