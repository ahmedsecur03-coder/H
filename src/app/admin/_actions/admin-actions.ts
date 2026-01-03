'use server';

import { initializeFirebaseServer } from "@/firebase/init-server";
import { getAuthenticatedUser } from "@/firebase/server-auth";
import { User, Deposit, Withdrawal, AgencyAccount, Notification, Campaign } from "@/lib/types";
import { collection, doc, runTransaction, increment, deleteDoc, arrayUnion } from "firebase/firestore";

// Main dispatcher function
export async function handleAdminAction(args: { action: string, payload: any }) {
    const { firestore } = initializeFirebaseServer();
    const { user } = await getAuthenticatedUser();
    
    if (user?.role !== 'admin') {
        return { success: false, error: 'Permission denied. Admin role required.' };
    }

    try {
        switch (args.action) {
            case 'handle-deposit':
                return await handleDeposit(firestore, args.payload);
            case 'handle-withdrawal':
                return await handleWithdrawal(firestore, args.payload);
            case 'handle-agency-charge':
                return await handleAgencyCharge(firestore, args.payload);
            case 'handle-campaign':
                return await handleCampaign(firestore, args.payload);
            case 'delete-document':
                 return await deleteDocument(firestore, args.payload.path);
            default:
                return { success: false, error: 'Invalid admin action' };
        }
    } catch (error: any) {
        console.error(`Admin action "${args.action}" failed:`, error);
        return { success: false, error: error.message || 'An unknown server error occurred.' };
    }
}


// --- Deposit Handler ---
const COMMISSION_RATES = [0.20, 0.10, 0.05, 0.03, 0.02, 0.01];
async function handleDeposit(firestore: FirebaseFirestore.Firestore, payload: { userId: string, depositId: string, amount: number, newStatus: 'مقبول' | 'مرفوض' }) {
    const { userId, depositId, amount, newStatus } = payload;
    const userRef = doc(firestore, 'users', userId);
    const depositDocRef = doc(firestore, `users/${userId}/deposits`, depositId);

    await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('المستخدم صاحب الإيداع غير موجود.');
        
        transaction.update(depositDocRef, { status: newStatus });

        if (newStatus === 'مقبول') {
            const userData = userDoc.data() as User;
            const notification: Notification = {
                id: `dep-${depositId}`, message: `تم قبول طلب الإيداع الخاص بك بقيمة ${amount}$ وتمت إضافة الرصيد إلى حسابك.`,
                type: 'success', read: false, createdAt: new Date().toISOString(), href: '/dashboard/add-funds'
            };
            transaction.update(userRef, {
                balance: increment(amount),
                totalSpent: increment(amount),
                notifications: arrayUnion(notification)
            });

            // Handle Affiliate Commissions
            let currentReferrerId = userData.referrerId;
            for (let level = 0; level < COMMISSION_RATES.length && currentReferrerId; level++) {
                const commissionRate = COMMISSION_RATES[level];
                const commissionAmount = amount * commissionRate;
                const referrerRef = doc(firestore, 'users', currentReferrerId);
                transaction.update(referrerRef, { affiliateEarnings: increment(commissionAmount) });

                const newTransactionRef = doc(collection(firestore, `users/${currentReferrerId}/affiliateTransactions`));
                transaction.set(newTransactionRef, {
                    userId: currentReferrerId, referralId: userId, orderId: depositId,
                    amount: commissionAmount, transactionDate: new Date().toISOString(), level: level + 1,
                });
                
                const referrerDoc = await transaction.get(referrerRef);
                currentReferrerId = referrerDoc.exists() ? (referrerDoc.data() as User).referrerId : null;
            }
        } else { // Rejected
            const notification: Notification = {
                id: `dep-${depositId}-rej`, message: `تم رفض طلب الإيداع الخاص بك بقيمة ${amount}$. يرجى مراجعة الدعم الفني.`,
                type: 'error', read: false, createdAt: new Date().toISOString(), href: '/dashboard/add-funds'
            };
            transaction.update(userRef, { notifications: arrayUnion(notification) });
        }
    });
    return { success: true };
}


// --- Withdrawal Handler ---
async function handleWithdrawal(firestore: FirebaseFirestore.Firestore, payload: { userId: string, withdrawalId: string, amount: number, newStatus: 'مقبول' | 'مرفوض' }) {
    const { userId, withdrawalId, amount, newStatus } = payload;
    const userRef = doc(firestore, 'users', userId);
    const withdrawalDocRef = doc(firestore, `users/${userId}/withdrawals`, withdrawalId);
    
    await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('المستخدم غير موجود.');
        
        transaction.update(withdrawalDocRef, { status: newStatus });

        if (newStatus === 'مقبول') {
            const userData = userDoc.data() as User;
            if ((userData.affiliateEarnings ?? 0) < amount) {
                throw new Error('رصيد أرباح المستخدم غير كافٍ.');
            }
            transaction.update(userRef, { affiliateEarnings: increment(-amount) });
        }
        // No action needed for 'مرفوض' besides updating status
    });
    return { success: true };
}


// --- Agency Charge Handler ---
async function handleAgencyCharge(firestore: FirebaseFirestore.Firestore, payload: { userId: string, requestId: string, accountId: string, amount: number, accountName: string, platform: string, newStatus: 'مقبول' | 'مرفوض' }) {
    const { userId, requestId, accountId, amount, accountName, platform, newStatus } = payload;
    const userRef = doc(firestore, 'users', userId);
    const requestDocRef = doc(firestore, `users/${userId}/agencyChargeRequests`, requestId);
    const accountDocRef = doc(firestore, `users/${userId}/agencyAccounts`, accountId);

    await runTransaction(firestore, async (transaction) => {
        transaction.update(requestDocRef, { status: newStatus });
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error('المستخدم صاحب الطلب غير موجود.');

        if (newStatus === 'مقبول') {
            const userData = userDoc.data() as User;
            const accountDoc = await transaction.get(accountDocRef);
            if (!accountDoc.exists()) throw new Error('الحساب الإعلاني المراد شحنه غير موجود.');
            if ((userData.adBalance ?? 0) < amount) throw new Error('رصيد إعلانات المستخدم غير كافٍ.');

            transaction.update(userRef, { adBalance: increment(-amount) });
            transaction.update(accountDocRef, { balance: increment(amount) });
            
            const notification: Notification = {
                id: `agency-charge-ok-${requestId}`,
                message: `تم قبول طلب شحن حسابك "${accountName}" بمبلغ ${amount}$ وتمت إضافة الرصيد.`,
                type: 'success', read: false, createdAt: new Date().toISOString(), href: '/dashboard/agency-accounts'
            };
            transaction.update(userRef, { notifications: arrayUnion(notification) });

        } else { // Rejected
            const notification: Notification = {
                id: `agency-charge-rej-${requestId}`,
                message: `تم رفض طلب شحن حسابك "${accountName}" بمبلغ ${amount}$. يرجى مراجعة الدعم الفني.`,
                type: 'error', read: false, createdAt: new Date().toISOString(), href: '/dashboard/agency-accounts'
            };
            transaction.update(userRef, { notifications: arrayUnion(notification) });
        }
    });
    return { success: true };
}


// --- Campaign Handler ---
async function handleCampaign(firestore: FirebaseFirestore.Firestore, payload: { userId: string, campaignId: string, subAction: 'activate' | 'pause' | 'delete' }) {
    const { userId, campaignId, subAction } = payload;
    const campaignDocRef = doc(firestore, `users/${userId}/campaigns`, campaignId);

    if (subAction === 'delete') {
        await deleteDoc(campaignDocRef);
        return { success: true };
    }

    const userDocRef = doc(firestore, 'users', userId);
    await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        const campaignDoc = await transaction.get(campaignDocRef);
        if (!userDoc.exists() || !campaignDoc.exists()) throw new Error("المستخدم أو الحملة غير موجود.");

        const userData = userDoc.data() as User;
        const campaignData = campaignDoc.data() as Campaign;

        if (subAction === 'activate') {
            if (campaignData.status !== 'متوقف') throw new Error("يمكن فقط تفعيل الحملات المتوقفة.");
            if (userData.adBalance < campaignData.budget) throw new Error("رصيد إعلانات المستخدم غير كافٍ.");
            transaction.update(userDocRef, { adBalance: increment(-campaignData.budget) });
            transaction.update(campaignDocRef, { status: 'نشط', startDate: new Date().toISOString() });
        } else if (subAction === 'pause') {
            if (campaignData.status !== 'نشط') throw new Error("يمكن فقط إيقاف الحملات النشطة.");
            const remainingBudget = campaignData.budget - (campaignData.spend || 0);
            if (remainingBudget > 0) {
                transaction.update(userDocRef, { adBalance: increment(remainingBudget) });
            }
            transaction.update(campaignDocRef, { status: 'متوقف' });
        }
    });
    return { success: true };
}

// --- Generic Delete Handler ---
async function deleteDocument(firestore: FirebaseFirestore.Firestore, path: string) {
    if (!path) throw new Error("Document path is required for deletion.");
    const docRef = doc(firestore, path);
    await deleteDoc(docRef);
    return { success: true };
}
