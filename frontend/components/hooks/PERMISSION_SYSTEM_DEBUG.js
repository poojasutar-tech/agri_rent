/**
 * PERMISSION SYSTEM DEBUGGING GUIDE
 * 
 * How to verify the role-based UI access control is working correctly
 */

// ============================================
// 1. PERMISSION STRUCTURE FROM API
// ============================================
// Expected response format for each item (Module/Submodule/Activity):
// {
//   "id": 1,
//   "name": "Module Name",
//   "permissions": {
//     "1": { "read": true, "write": false, "update": false },    // Admin: READ only
//     "2": { "read": false, "write": true, "update": false },    // User: WRITE only
//     "3": { "read": false, "write": false, "update": true },    // Manager: UPDATE only
//     "4": { "read": true, "write": true, "update": true }       // Super User: ALL
//   }
// }

// ============================================
// 2. PERMISSION LOGIC RULES
// ============================================
// READ (read=true, write=false, update=false)
//   ✓ View data
//   ✗ Add New (hidden)
//   ✗ Edit (hidden)
//   ✗ Delete (hidden)

// WRITE (read=false, write=true, update=false)
//   ✓ View data
//   ✓ Add New (visible)
//   ✗ Edit (hidden)
//   ✗ Delete (hidden)

// UPDATE (read=false, write=false, update=true)
//   ✓ View data
//   ✗ Add New (hidden)
//   ✓ Edit (visible)
//   ✓ Delete (visible)

// ALL (read=true, write=true, update=true)
//   ✓ View data
//   ✓ Add New (visible)
//   ✓ Edit (visible)
//   ✓ Delete (visible)

// ============================================
// 3. COMPONENT DATA FLOW
// ============================================
// 1. Component loads → Fetch user profile
//    - GET /user/profile/ → Get currentUserTypeId
//
// 2. Load items list
//    - GET /engine-module/ (or other endpoints)
//    - Items must include "permissions" object with usertype_id as keys
//
// 3. When user selects an item
//    - Call getAllowedActions(selectedItem)
//    - Function checks: item.permissions[currentUserTypeId]
//    - Normalizes permission values (boolean, "Yes"/"No", 1/0)
//    - Returns: { canAddNew, canEdit, canDelete }
//
// 4. Conditionally render buttons based on allowed actions

// ============================================
// 4. TESTING CHECKLIST
// ============================================
// □ User profile fetch returns usertype_id
// □ API returns items with permissions object
// □ Permissions keys match usertype_id from profile
// □ Permission values are normalized correctly
// □ READ-only users see no action buttons
// □ WRITE-only users see only "Add New" button
// □ UPDATE-only users see "Edit" and "Delete" buttons
// □ ALL-permission users see all buttons
// □ Disabled buttons show lock icon

// ============================================
// 5. DEBUGGING IN CONSOLE
// ============================================
// To debug in browser console:

// Check current user's role
// const userTypeId = localStorage.getItem('currentUserTypeId');
// console.log('Current User Type ID:', userTypeId);

// Check permissions structure
// const item = data[0]; // First item from list
// console.log('Item permissions:', item.permissions);
// console.log('User permissions for this item:', item.permissions[userTypeId]);

// Check normalized values
// const perm = item.permissions[userTypeId];
// const read = perm?.read === true || perm?.read === "Yes";
// const write = perm?.write === true || perm?.write === "Yes";
// const update = perm?.update === true || perm?.update === "Yes";
// console.log(`Read: ${read}, Write: ${write}, Update: ${update}`);

// ============================================
// 6. COMMON ISSUES & FIXES
// ============================================

// Issue: Buttons always hidden
// Possible causes:
// - currentUserTypeId is null or undefined
// - item.permissions is missing from API response
// - usertype_id in permissions object doesn't match currentUserTypeId
// Fix: Check API response structure, verify user profile fetch

// Issue: All buttons shown regardless of permission
// Possible causes:
// - getAllowedActions() returning wrong values
// - Permission normalization failing (check for correct format)
// Fix: Verify permission values in API response

// Issue: Lock icons not showing for disabled actions
// Possible causes:
// - UI component not rendering disabled button
// - CSS classes missing
// Fix: Check button rendering logic in component

// ============================================
// 7. IMPROVED PERMISSION CHECKING
// ============================================
// New normalization function handles multiple formats:

const normalizePermission = (value) => {
  if (value === true) return true;      // Boolean true
  if (value === 1) return true;          // Integer 1
  if (value === "1") return true;        // String "1"
  if (value === "Yes") return true;      // String "Yes"
  if (value === "yes") return true;      // String "yes"
  return false;                          // Everything else is false
};

// New action determination logic (single permission = single action):
// - WRITE only → Can add new (nothing else)
// - UPDATE only → Can edit & delete (nothing else)
// - No compound logic, just direct mapping

export default {
  // Debug helper function to log permission analysis
  analyzePermissions: (item, userTypeId) => {
    console.group(`Analyzing permissions for item ${item.id}`);
    console.log('Item:', item);
    console.log('Current User Type ID:', userTypeId);
    
    const userPerm = item.permissions?.[userTypeId];
    console.log('User Permission Object:', userPerm);
    
    if (!userPerm) {
      console.warn('No permissions found for this user type!');
      console.groupEnd();
      return null;
    }
    
    const read = userPerm.read === true || userPerm.read === "Yes";
    const write = userPerm.write === true || userPerm.write === "Yes";
    const update = userPerm.update === true || userPerm.update === "Yes";
    
    console.log('Normalized values:', { read, write, update });
    console.log('Actions:', {
      canAddNew: write,
      canEdit: update,
      canDelete: update,
    });
    
    console.groupEnd();
  }
};
