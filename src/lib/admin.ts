export function getAdminTokenFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export function isAdminRequest(req: Request) {
  const token = getAdminTokenFromRequest(req);
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(token && expected && token === expected);
}
