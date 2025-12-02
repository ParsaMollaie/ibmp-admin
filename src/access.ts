/**
 * Access control configuration for UmiJS.
 * This function receives the initialState (which contains the current user)
 * and returns an object with permission flags.
 *
 * These flags can be used in routes (via `access` property) or components
 * (via `useAccess` hook) to control what the user can see/do.
 */
export default (initialState: { currentUser?: API.UserInfo } | undefined) => {
  const { currentUser } = initialState || {};

  // User can access admin features if they're logged in and have admin role
  const canSeeAdmin = !!(currentUser && currentUser.user_type === 'admin');

  // You can add more granular permissions here as needed
  // For example: canManageUsers, canEditNews, etc.

  return {
    canSeeAdmin,
  };
};
