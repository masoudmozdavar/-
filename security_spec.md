# Security Specification (Firestore ABAC)

## 1. Data Invariants
- Each user profile resides at `/users/{userId}` and is read/written strictly by its owner (`request.auth.uid == userId`).
- Subcollections (`accounts`, `transactions`, `categories`, `checks`, `loans`, `debts`, `goals`, `familyMembers`) inherit parent ownership under `/users/{userId}`.
- Private credentials and recovery information reside in isolated subcollection `/users/{userId}/private/{credId}`.
- All documents validate strict key constraints, types, string lengths, and numeric positivity.

## 2. Tested Threat Scenarios (Dirty Dozen)
1. Unauthenticated user trying to read user profile -> DENIED.
2. User A trying to read transactions of User B -> DENIED.
3. User A trying to write accounts under User B's path -> DENIED.
4. User A trying to read User B's private credentials -> DENIED.
5. Injected oversized string or ID poisoning in document ID -> DENIED.
6. Mutation attempting to change document `userId` to another user's ID -> DENIED.
7. Negative or non-numeric amount in transaction -> DENIED.
8. Unregistered / random collection write -> DENIED.
9. Missing required fields during account creation -> DENIED.
10. Attempt to spoof another user's UID on transaction creation -> DENIED.
11. Bypassing validation with extra unknown fields -> DENIED.
12. Attempt to delete another user's debt or check records -> DENIED.
