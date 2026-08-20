export interface User {
  id: number;
  username: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  shifts: String[];
}
