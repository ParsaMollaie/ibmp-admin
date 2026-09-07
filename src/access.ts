/**
 * Access control configuration for UmiJS.
 * This function receives the initialState (which contains the current user)
 * and returns an object with permission flags.
 *
 * `hasPermission` is a function-valued flag (not a static boolean) since the actual permission
 * set is dynamic and backend-driven (see config/route_permissions.php in the Laravel backend) —
 * Umi's per-route `access:` field only supports static flag names, so route-level menu filtering
 * uses a separate `menuDataRender` hook in app.tsx instead; this flag is for in-page button/action
 * gating via `useAccess()`.
 */
export default (initialState: { currentUser?: API.UserInfo } | undefined) => {
  const { currentUser } = initialState || {};

  // User can access admin features if they're logged in and have admin role
  const canSeeAdmin = !!(currentUser && currentUser.user_type === 'admin');

  const permissions = currentUser?.permissions ?? [];
  const hasPermission = (permission: string) =>
    permissions.includes(permission);

  return {
    canSeeAdmin,
    hasPermission,
  };
};
