import invariant from "tiny-invariant";

export function getEnv() {
  invariant(process.env.ADMIN_EMAIL, "Admin email should be defined");
  return {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  };
}

export default function useOptionalAdminUser() {
  const user = useOptionalUser();
  if (!user) return null;
  if (user.email !== ENV.ADMIN_EMAIL) return null;
  return user;
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
