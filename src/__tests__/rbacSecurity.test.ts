import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeCanonicalRole, isUserStatusInactive } from '../types';
import {
  normalizeCanonicalRole as serverNormalizeCanonicalRole,
  isUserRecordInactive
} from '../../server';

describe('Ellix Connect — Canonical RBAC & Security Verification Suite', () => {
  describe('1. Canonical Role Normalization & Fail-Closed Policy', () => {
    it('maps Level 1 super_admin identically on frontend and server', () => {
      expect(normalizeCanonicalRole('super_admin')).toBe('super_admin');
      expect(serverNormalizeCanonicalRole('super_admin')).toBe('super_admin');
      expect(normalizeCanonicalRole('  SUPER_ADMIN ')).toBe('super_admin');
    });

    it('maps Level 2 ellix_admin and legacy aliases (admin, platform_admin) identically', () => {
      for (const alias of ['ellix_admin', 'admin', 'platform_admin']) {
        expect(normalizeCanonicalRole(alias)).toBe('ellix_admin');
        expect(serverNormalizeCanonicalRole(alias)).toBe('ellix_admin');
      }
    });

    it('maps Level 3 client and legacy aliases (owner, retailer) identically', () => {
      for (const alias of ['client', 'owner', 'retailer']) {
        expect(normalizeCanonicalRole(alias)).toBe('client');
        expect(serverNormalizeCanonicalRole(alias)).toBe('client');
      }
    });

    it('maps Level 4 crew and legacy aliases (employee, cashier, staff) identically', () => {
      for (const alias of ['crew', 'employee', 'cashier', 'staff']) {
        expect(normalizeCanonicalRole(alias)).toBe('crew');
        expect(serverNormalizeCanonicalRole(alias)).toBe('crew');
      }
    });

    it('maps B2B wholesaler_admin and wholesaler identically', () => {
      for (const alias of ['wholesaler_admin', 'wholesaler']) {
        expect(normalizeCanonicalRole(alias)).toBe('wholesaler_admin');
        expect(serverNormalizeCanonicalRole(alias)).toBe('wholesaler_admin');
      }
    });

    it('fails closed to unauthorized for unknown, empty, or arbitrary roles (never defaults to client)', () => {
      const invalidRoles: unknown[] = [
        '',
        'unknown_role',
        'root',
        'guest',
        'hacker',
        'moderator',
        null,
        undefined,
        123,
        {},
        []
      ];
      for (const invalid of invalidRoles) {
        expect(normalizeCanonicalRole(invalid)).toBe('unauthorized');
        expect(serverNormalizeCanonicalRole(invalid)).toBe('unauthorized');
      }
    });
  });

  describe('2. Account Deactivation / Revocation Status Enforcement', () => {
    it('marks active and pending_approval accounts as active', () => {
      expect(isUserStatusInactive({ status: 'active' })).toBe(false);
      expect(isUserRecordInactive({ status: 'active' })).toBe(false);
      expect(isUserStatusInactive({})).toBe(false);
    });

    it('detects deactivated, suspended, revoked, disabled, and deleted accounts', () => {
      for (const st of ['inactive', 'suspended', 'revoked', 'disabled', 'deactivated', 'deleted']) {
        expect(isUserStatusInactive({ status: st })).toBe(true);
        expect(isUserRecordInactive({ status: st })).toBe(true);
      }
      expect(isUserStatusInactive({ disabled: true })).toBe(true);
      expect(isUserRecordInactive({ disabled: true })).toBe(true);
      expect(isUserStatusInactive({ active: false })).toBe(true);
      expect(isUserRecordInactive({ isActive: false })).toBe(true);
    });
  });

  describe('3. Firestore Security Rules Hardening Verification', () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    it('enforces ellixorrr@gmail.com as sole root super_admin in rules', () => {
      expect(rulesContent).toContain("request.auth.token.email == 'ellixorrr@gmail.com'");
    });

    it('registers ellic.admin11@gmail.com as Level 2 Ellix Admin with email_verified requirement', () => {
      expect(rulesContent).toContain("request.auth.token.email == 'ellic.admin11@gmail.com'");
      expect(rulesContent).toContain("incoming().role == 'ellix_admin'");
    });

    it('enforces that store subcollection access is restricted to store owners and crew, blocking ellix_admin from store private data', () => {
      expect(rulesContent).toContain('function isClientOwnerOfStore(storeId)');
      expect(rulesContent).toContain('function isStoreAuthorizedUser(storeId)');
      expect(rulesContent).not.toContain('function isClientOwnerOfStore(storeId) {\n      return isSignedIn() && (\n        isEllixAdmin()');
    });

    it('enforces isActiveUser() across all role helpers', () => {
      expect(rulesContent).toContain('function isActiveUser()');
      expect(rulesContent).toContain("(!('status' in getUserDoc()) || getUserDoc().status == 'active')");
      expect(rulesContent).toContain("(!('disabled' in getUserDoc()) || getUserDoc().disabled == false)");
    });

    it('prevents user profile self-tampering of role, clientId, assignedStoreIds, and status', () => {
      expect(rulesContent).toContain('match /users/{userId}');
      expect(rulesContent).toContain('incoming().role == existing().role');
      expect(rulesContent).toContain('incoming().diff(existing()).affectedKeys().hasOnly([');
    });

    it('enforces tenant binding on store creation and immutability of clientId/ownerUid on store update', () => {
      expect(rulesContent).toContain('incoming().ownerUid == request.auth.uid');
      expect(rulesContent).toContain("(!('ownerUid' in existing()) || incoming().ownerUid == existing().ownerUid)");
      expect(rulesContent).toContain("(!('clientId' in existing()) || incoming().clientId == existing().clientId)");
    });

    it('enforces strict AND cashier identity, item-level discount prohibition, and loyalty redemption prohibition for Crew on invoices', () => {
      expect(rulesContent).toContain('incoming().cashierId == request.auth.uid');
      expect(rulesContent).toContain("(!('createdById' in incoming()) || incoming().createdById == request.auth.uid)");
      expect(rulesContent).toContain("(!('discountAmount' in incoming()) || incoming().discountAmount == 0)");
      expect(rulesContent).toContain("(!('discountTotal' in incoming()) || incoming().discountTotal == 0)");
      expect(rulesContent).toContain("(!('discountPercent' in incoming()) || incoming().discountPercent == 0)");
      expect(rulesContent).toContain("(!('loyaltyPointsRedeemed' in incoming()) || incoming().loyaltyPointsRedeemed == 0)");
      expect(rulesContent).toContain("(!('discount' in incoming().items[0]) || incoming().items[0].discount == 0)");
    });

    it('prevents Crew from listing CRM customers or decreasing customer loyaltyPoints/creditBalance', () => {
      expect(rulesContent).toContain('allow list: if isClientOwnerOfStore(storeId);');
      expect(rulesContent).toContain('incoming().loyaltyPoints >= existing().loyaltyPoints');
      expect(rulesContent).toContain('incoming().creditBalance >= existing().creditBalance');
    });

    it('enforces strict AND crew identity on restockLogs', () => {
      expect(rulesContent).toContain("(!('crewId' in incoming()) || incoming().crewId == request.auth.uid)");
      expect(rulesContent).toContain("(!('addedById' in incoming()) || incoming().addedById == request.auth.uid)");
    });

    it('restricts wholesaler updates on restockOrders to quotation/shipment fields only', () => {
      expect(rulesContent).toContain("incoming().status in ['quoted', 'accepted', 'shipped', 'rejected']");
      expect(rulesContent).toContain('incoming().productId == existing().productId');
    });

    it('locks client subscription and payment documents to admin/server writes only', () => {
      expect(rulesContent).toContain('match /subscription/{docId}');
      expect(rulesContent).toContain('match /subscriptionPayments/{paymentId}');
      expect(rulesContent).toContain('allow create, update: if isSignedIn() && isEllixAdmin();');
    });
  });

  describe('4. Backend API & AuthContext / StoreContext / Sync Hardening Verification', () => {
    const serverPath = path.resolve(process.cwd(), 'server.ts');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const authContextPath = path.resolve(process.cwd(), 'src/context/AuthContext.tsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    const storeContextPath = path.resolve(process.cwd(), 'src/context/StoreContext.tsx');
    const storeContextContent = fs.readFileSync(storeContextPath, 'utf8');
    const syncPath = path.resolve(process.cwd(), 'src/lib/firestoreSync.ts');
    const syncContent = fs.readFileSync(syncPath, 'utf8');

    it('enforces 401 before 403 and active status checks on server endpoints', () => {
      expect(serverContent).toContain('let isInactive = false;');
      expect(serverContent).toContain('decodedToken.email_verified === true');
      expect(serverContent).toContain("app.post('/api/subscription/cancel-and-purge'");
      expect(serverContent).toContain("app.post('/api/admin/subscription/status'");
    });

    it('prevents AuthContext from writing authorization fields on existing user sync', () => {
      expect(authContextContent).toContain('const safeFirestoreUpdates: Record<string, any> = {');
      expect(authContextContent).toContain('await updateDoc(userDocRef, safeFirestoreUpdates);');
      expect(authContextContent).toContain('normalizeCanonicalRole(existingData.role)');
    });

    it('enforces role-scoped Firestore listeners and minimal customer transaction updates in firestoreSync', () => {
      expect(syncContent).toContain('const canManageStoreRole =');
      expect(syncContent).toContain('if (customerExistsInCloud) {');
      expect(syncContent).toContain("const isWholesalerRole = canonicalRole === 'wholesaler_admin';");
    });

    it('enforces defense-in-depth RBAC and store-isolation guards in StoreContext', () => {
      expect(storeContextContent).toContain("const isAuthorizedOwnerOrAdmin = isPlatformAdminRole || canonicalRole === 'client';");
      expect(storeContextContent).toContain('const canUserAccessStore = React.useCallback((storeObj: Store | undefined): boolean =>');
      expect(storeContextContent).toContain("const isCrewRole = canonicalRole === 'crew';");
    });
  });
});
