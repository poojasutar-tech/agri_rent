/**
 * Custom hook to determine allowed CRUD actions based on role permissions
 * 
 * Permission Logic:
 * - READ only: View only (no Add/Edit/Delete)
 * - WRITE only: Can Add New (no Edit/Delete)
 * - UPDATE only: Can Edit/Delete (no Add New)
 * - ALL: Full access (Add/Edit/Delete)
 */

import { useMemo } from 'react';

/**
 * Normalize permission values from API
 * Handles: boolean, "Yes"/"No" strings, 1/0
 */
const normalizePermission = (value) => {
  if (value === true || value === 1 || value === "1" || value === "Yes") return true;
  return false;
};

/**
 * Determine allowed actions based on permission flags
 */
const determineActions = (read, write, update) => {
  return {
    canRead: read,
    canWrite: write,
    canUpdate: update,
    canAddNew: write === true,  // WRITE permission allows adding
    canEdit: update === true,    // UPDATE permission allows editing
    canDelete: update === true,  // UPDATE permission allows deleting
    hasAccess: read || write || update,
  };
};

export const usePermissions = (userTypeId, permissions) => {
  return useMemo(() => {
    if (!userTypeId || !permissions) {
      return {
        canRead: false,
        canWrite: false,
        canUpdate: false,
        canAddNew: false,
        canEdit: false,
        canDelete: false,
        hasAccess: false,
      };
    }

    const userPerm = permissions[userTypeId];
    
    if (!userPerm) {
      return {
        canRead: false,
        canWrite: false,
        canUpdate: false,
        canAddNew: false,
        canEdit: false,
        canDelete: false,
        hasAccess: false,
      };
    }

    // Normalize permission values
    const read = normalizePermission(userPerm.read);
    const write = normalizePermission(userPerm.write);
    const update = normalizePermission(userPerm.update);

    return determineActions(read, write, update);
  }, [userTypeId, permissions]);
};

/**
 * Helper function to get actions for a specific permission object
 * Used for inline permission checking in components
 */
export const getActionsForPermissions = (permissionObj) => {
  if (!permissionObj) {
    return {
      canRead: false,
      canWrite: false,
      canUpdate: false,
      canAddNew: false,
      canEdit: false,
      canDelete: false,
      hasAccess: false,
    };
  }

  const read = normalizePermission(permissionObj.read);
  const write = normalizePermission(permissionObj.write);
  const update = normalizePermission(permissionObj.update);

  return determineActions(read, write, update);
};

/**
 * Get action permissions based on a single permission flag
 * @param {string} permissionType - 'read', 'write', 'update', or 'all'
 * @returns {Object} - Actions allowed for this permission type
 */
export const getPermissionActions = (permissionType) => {
  const permissionMap = {
    read: {
      canAddNew: false,
      canEdit: false,
      canDelete: false,
      label: 'View Only',
    },
    write: {
      canAddNew: true,
      canEdit: false,
      canDelete: false,
      label: 'Can Add New',
    },
    update: {
      canAddNew: false,
      canEdit: true,
      canDelete: true,
      label: 'Can Edit & Delete',
    },
    all: {
      canAddNew: true,
      canEdit: true,
      canDelete: true,
      label: 'Full Access',
    },
  };

  return permissionMap[permissionType] || {
    canAddNew: false,
    canEdit: false,
    canDelete: false,
    label: 'No Access',
  };
};

/**
 * Determine dominant permission type from read/write/update flags
 */
export const getDominantPermission = (read, write, update) => {
  if (read && write && update) return 'all';
  if (update) return 'update';
  if (write) return 'write';
  if (read) return 'read';
  return null;
};
