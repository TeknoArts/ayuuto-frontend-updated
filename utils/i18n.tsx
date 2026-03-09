import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'so';

const LANGUAGE_STORAGE_KEY = '@ayuuto_language';

// Translation files
const translations = {
  en: {
    // Settings
    settings: 'SETTINGS',
    english: 'ENGLISH',
    somali: 'SOMALI',
    logout: 'LOGOUT',
    logoutConfirm: 'Are you sure you want to logout?',
    deleteAccount: 'DELETE ACCOUNT',
    deleteAccountConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    
    // Home
    home: 'HOME',
    ayuutoManager: 'AYUUTO MANAGER',
    newGroup: 'NEW GROUP',
    totalSavings: 'Total Savings',
    members: 'Members',
    
    // New Group
    newGroupTitle: 'NEW GROUP',
    back: 'BACK',
    groupName: 'GROUP NAME:',
    memberCount: 'MEMBER COUNT:',
    next: 'NEXT',
    loading: 'LOADING...',
    invalidMemberCount: 'Invalid Member Count',
    atLeastTwoMembers: 'At least 2 members are required to create a group.',
    
    // Add Participants
    addParticipants: 'ADD PARTICIPANTS',
    participant: 'PARTICIPANT',
    create: 'CREATE',
    
    // Collection
    collection: 'COLLECTION',
    amountPerPerson: 'AMOUNT PER PERSON:',
    collectionDate: 'COLLECTION DATE:',
    monthly: 'MONTHLY',
    weekly: 'WEEKLY',
    
    // Group Details
    savings: 'SAVINGS',
    admin: 'ADMIN',
    completed: 'COMPLETED',
    nextRecipient: 'NEXT RECIPIENT',
    collectionDay: 'COLLECTION DAY:',
    spinForOrder: 'SPIN FOR ORDER',
    spinning: 'SPINNING...',
    paymentStatus: 'PAYMENT STATUS',
    share: 'SHARE',
    paid: 'PAID',
    unpaid: 'UNPAID',
    paidOut: 'PAID OUT',
    payNow: 'PAY NOW',
    nextRound: 'NEXT ROUND',
    ayuutoCompleted: 'AYUUTO COMPLETED',
    allMembersPaidOut: 'ALL MEMBERS HAVE BEEN PAID OUT SAFELY.',
    viewOnlyMode: 'VIEW ONLY MODE - You can view but not edit this group',
    viewOnly: 'View Only',
    onlyOwnerCanEdit: 'You can only view this group. Only the group owner can make changes.',
    
    // Payment Processing
    congratulations: 'CONGRATULATIONS!',
    round: 'ROUND',
    youAreReceiving: 'You are receiving this amount',
    
    // Next Round
    nextRoundStarting: 'NEXT ROUND',
    settingOrder: 'SETTING ORDER',
    preparingRound: 'PREPARING ROUND',
    starting: 'STARTING',
    nextLabel: 'Next:',
    spinningParticipants: 'Spinning participants…',
    
    // Group Created
    groupCreated: 'GROUP CREATED',
    celebrate: 'CELEBRATE',
    
    // Activity Log
    activityLog: 'ACTIVITY LOG',
    loadingActivities: 'Loading activities...',
    noActivities: 'No activities yet',
    noActivitiesSubtext: 'Your group activities will appear here',
    
    // Common
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    goBack: 'Go Back',
    
    // Login/Signup
    welcomeBack: 'Welcome Back',
    signIn: 'Sign in to continue',
    emailOrPhone: 'Email or Phone',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    login: 'LOGIN',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    joinAyuuto: 'Join Ayuuto to get started',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    createAccountButton: 'CREATE ACCOUNT',
    
    // Home Screen
    welcomeToAyuuto: 'Welcome to Ayuuto',
    organizeWithTrust: 'ORGANIZE WITH TRUST, CELEBRATE TOGETHER.',
    myAyuutos: 'MY AYUUTOS',
    dontManageGroups: "YOU DON'T MANAGE ANY GROUPS YET.",
    noJoinedGroups: "YOU HAVEN'T JOINED ANY GROUPS YET.",
    loading: 'Loading...',
    
    // Group Details
    manageParticipants: 'MANAGE PARTICIPANTS',
    addParticipant: 'Add Participant',
    addParticipantSlots: 'ADD PARTICIPANT',
    slotsLeft: 'slot',
    slotsLeftPlural: 'slots',
    allSlotsFilled: 'All slots filled',
    noParticipantsYet: 'No participants added yet.',
    removeParticipant: 'Remove Participant',
    removeParticipantConfirm: 'Are you sure you want to remove',
    thisParticipant: 'this participant',
    groupActivity: 'GROUP ACTIVITY',
    viewMore: 'VIEW MORE',
    noActivityYet: 'No activity yet.',
    loadingActivity: 'Loading activity...',
    updatingPayment: 'Updating payment...',
    
    // Payment Processing
    settingOrder: 'SETTING ORDER',
    preparingRound: 'PREPARING ROUND',
    spinningParticipants: 'Spinning participants…',
    starting: 'STARTING',
    
    // Errors & Messages
    loginFailed: 'Login Failed',
    invalidCredentials: 'Invalid email or password. Please try again.',
    signUpFailed: 'Sign Up Failed',
    unableToSignUp: 'Unable to sign up. Please try again.',
    emailRequired: 'Email Required',
    pleaseEnterEmail: 'Please enter your email address.',
    invalidEmail: 'Invalid Email',
    pleaseEnterValidEmail: 'Please enter a valid email address.',
    passwordRequired: 'Password Required',
    pleaseEnterPassword: 'Please enter and confirm your new password.',
    passwordTooShort: 'Password Too Short',
    passwordMinLength: 'Password must be at least 6 characters long.',
    passwordMismatch: 'Password Mismatch',
    passwordsDoNotMatch: 'Passwords do not match. Please try again.',
    missingInformation: 'Missing Information',
    pleaseFillAllFields: 'Please fill in all required fields.',
    limitReached: 'Limit Reached',
    allSlotsFilledMessage: 'All participant slots are already filled.',
    failedToLoad: 'Failed to load',
    failedToAdd: 'Failed to add participant.',
    failedToRemove: 'Failed to remove participant.',
    failedToDelete: 'Failed to delete group. Please try again.',
    groupDeletedSuccess: 'Group deleted successfully.',
    failedToCreate: 'Failed to create group or set collection details. Please try again.',
    failedToLoadGroups: 'Failed to load groups. Please try again.',
    failedToLoadGroupDetails: 'Failed to load group details. Please try again.',
    failedToSpin: 'Failed to spin for order. Please try again.',
    failedToUpdatePayment: 'Failed to update payment status. Please try again.',
    failedToShare: 'Failed to share group details. Please try again.',
    failedToStartRound: 'Failed to start next round. Please try again.',
    groupInfoMissing: 'Group information is missing. Please try again.',
    groupIdMissing: 'Group ID is missing. Please try again.',
    invalidGroupId: 'Invalid group ID. Please try again.',
    failedToNavigate: 'Failed to navigate to group details. Please try again.',
    failedToLoadUsers: 'Failed to load users. Please try again.',
    failedToChangeLanguage: 'Failed to change language. Please try again.',
    unableToLogin: 'Unable to login. Please try again.',
    unableToSendOTP: 'Unable to send OTP. Please try again.',
    verificationFailed: 'Verification Failed',
    invalidOTP: 'Invalid OTP. Please check and try again.',
    incompleteOTP: 'Incomplete OTP',
    pleaseEnterCompleteOTP: 'Please enter the complete 5-digit OTP code.',
    resetFailed: 'Reset Failed',
    unableToResetPassword: 'Unable to reset password. Please try again.',
    verificationTokenMissing: 'Verification Token Missing',
    verificationTokenMissingMessage: 'Verification token is missing. Please verify OTP again.',
  },
  so: {
    // Settings
    settings: 'GOOBTA',
    english: 'INGIRIIS',
    somali: 'SOOMAALI',
    logout: 'KA BAX',
    logoutConfirm: 'Ma hubtaa inaad ka baxayso?',
    deleteAccount: 'TIRI KOONTA',
    deleteAccountConfirm: 'Ma hubtaa inaad koontada tirtid? Tani dib looma celin karo.',
    cancel: 'Jooji',
    delete: 'Tir',
    
    // Home
    home: 'GURIGA',
    ayuutoManager: 'MAAMULAYAASHA AYUUTO',
    newGroup: 'KOONTA CUSUB',
    totalSavings: 'Wadarta Kaydka',
    members: 'Xubnaha',
    
    // New Group
    newGroupTitle: 'KOONTA CUSUB',
    back: 'DIB U NOQO',
    groupName: 'MAGACA KOONTA:',
    memberCount: 'TIRO XUBNEED:',
    next: 'SOO SOCDA',
    loading: 'WAA LA HELAYAA...',
    invalidMemberCount: 'Tiro Xubneed Qaldan',
    atLeastTwoMembers: 'Waa in ugu yaraan laba xubnood la helaa si loo abuuro koonta.',
    
    // Add Participants
    addParticipants: 'KU DAR XUBNEED',
    participant: 'XUBNE',
    create: 'ABUUR',
    celebrate: 'U HAMBALYEER',
    
    // Collection
    collection: 'URURINTA',
    amountPerPerson: 'QADAR QOFKA:',
    collectionDate: 'TAARIKHA URURINTA:',
    monthly: 'BISHII WALBA',
    weekly: 'TODDBAAD WALBA',
    
    // Group Details
    savings: 'KAYDKA',
    admin: 'MAAMULAYAASHA',
    completed: 'DHAMMAADAY',
    nextRecipient: 'QAATAHA SOO SOCDA',
    collectionDay: 'MAALINTA URURINTA:',
    spinForOrder: 'WAREEG SI AAD U HESHO JARAYNTA',
    spinning: 'WAA LA WAREEGAYAA...',
    paymentStatus: 'XAAJADA LACAGTA',
    share: 'WADAAG',
    paid: 'LACAG BIXIYAY',
    unpaid: 'LACAG BIXIN',
    paidOut: 'LACAG LAGA HELAY',
    payNow: 'HADDA BIXI',
    nextRound: 'WAREEGGA SOO SOCDA',
    ayuutoCompleted: 'AYUUTO WAA DHAMMAADAY',
    allMembersPaidOut: 'DHAMMAAN XUBNEED WAA LACAG LAGA HELAY SIDII LOO BAANAY.',
    viewOnlyMode: 'EEGIS KELIYA - Waad aragti kartaa laakiin ma wax ka beddeli kartid koontan',
    viewOnly: 'Eegis Keliya',
    onlyOwnerCanEdit: 'Waxaad kaliya aragti u heshaa koontan. Kaliya milkiilaha koontada ayaa wax ka beddeli kara.',
    
    // Payment Processing
    congratulations: 'HAMBALYO!',
    round: 'WAREEG',
    youAreReceiving: 'Waxaad helaysaa qadarkan',
    
    // Next Round
    nextRoundStarting: 'WAREEGGA SOO SOCDA',
    settingOrder: 'DEJINTA JARAYNTA',
    preparingRound: 'DIYAARINAYA WAREEGGA',
    starting: 'WAA LA BILAABAYAA',
    nextLabel: 'Soo socda:',
    spinningParticipants: 'Waa la wareegayaa xubneeda...',
    
    // Group Created
    groupCreated: 'KOONTA WAA LA ABUURAY',
    celebrate: 'U HAMBALYEER',
    
    // Activity Log
    activityLog: 'DIIWAANGELINTA HAWLAHA',
    loadingActivities: 'Hawlaha waa la helayaa...',
    noActivities: 'Wali ma jiro hawlo',
    noActivitiesSubtext: 'Hawlaha koontadaada halkan ayaa u muuqan doona',
    
    // Common
    error: 'Qalad',
    success: 'Guul',
    retry: 'Dib U Isku Day',
    goBack: 'Dib U Noqo',
    
    // Login/Signup
    welcomeBack: 'Soo Dhawow',
    signIn: 'Gali si aad u sii wadato',
    emailOrPhone: 'Iimaylka ama Telefoonka',
    password: 'Furaha',
    forgotPassword: 'Furaha ma ilowday?',
    enterEmailForOTP: 'Geli ciwaanka iimaylkaaga waxaana kuu soo diri doonaa koodhka OTP-ka 5-lambar ah.',
    otpSent: 'Koodhka OTP waa la diray!',
    login: 'GALI',
    dontHaveAccount: 'Ma haysatid koont?',
    signUp: 'Isdiiwaangeli',
    createAccount: 'Abuur Koont',
    joinAyuuto: 'Ku biir Ayuuto si aad u bilowdo',
    name: 'Magaca',
    confirmPassword: 'Xaqiiji Furaha',
    confirmNewPassword: 'Xaqiiji Furaha Cusub',
    newPassword: 'Furaha Cusub',
    changePassword: 'Beddela Furaha',
    createNewPassword: 'Samee furaha cusub ee koontadaada.',
    passwordChangedSuccess: 'Furaha si guul leh ayaa loo beddelay! Waa la u kaxaynayaa galitaanka...',
    invalidSession: 'Fadhi Qaldan',
    pleaseVerifyOTPFirst: 'Fadlan marka hore xaqiiji koodhka OTP-ka ka hor intaadan furaha dib ugu dejin.',
    createAccountButton: 'ABUUR KOONT',
    
    // Home Screen
    welcomeToAyuuto: 'Ku soo dhawoow Ayuuto',
    organizeWithTrust: 'U MAAMUL IIMAAN, U HAMBALYEER WADARTA.',
    myAyuutos: 'AYUUTADA AYAN',
    dontManageGroups: 'WALI MA MAAMULAYSO KOONNO.',
    noJoinedGroups: 'WALI MA KU BIIRAY KOONNO.',
    loading: 'Waa la helayaa...',
    
    // Group Details
    manageParticipants: 'MAAMUL XUBNEED',
    addParticipant: 'Ku Dar Xubne',
    addParticipantSlots: 'KU DAR XUBNE',
    slotsLeft: 'meel',
    slotsLeftPlural: 'meelo',
    left: 'ayaa hadhay',
    allSlotsFilled: 'Dhammaan meelaha waa la buuxiyay',
    noParticipantsYet: 'Wali ma la darin xubne.',
    removeParticipant: 'Ka Saar Xubne',
    removeParticipantConfirm: 'Ma hubtaa inaad ka saartid',
    thisParticipant: 'xubnahan',
    groupActivity: 'HAWLAHA KOONTA',
    viewMore: 'WAX BADAN ARAAG',
    noActivityYet: 'Wali ma jiro hawlo.',
    loadingActivity: 'Hawlaha waa la helayaa...',
    updatingPayment: 'Lacag bixinta waa la cusboonaysiinayaa...',
    
    // Payment Processing
    settingOrder: 'DEJINTA JARAYNTA',
    preparingRound: 'DIYAARINAYA WAREEGGA',
    spinningParticipants: 'Waa la wareegayaa xubneeda...',
    starting: 'WAA LA BILAABAYAA',
    
    // Errors & Messages
    loginFailed: 'Galitaanka Waa Fashilmay',
    invalidCredentials: 'Iimaylka ama furaha waa qaldan. Dib u isku day.',
    signUpFailed: 'Isdiiwaangelinta Waa Fashilmay',
    unableToSignUp: 'Waa la isdiiwaangeli kari waayay. Dib u isku day.',
    emailRequired: 'Iimaylka Waa Loo Baahan Yahay',
    pleaseEnterEmail: 'Fadlan geli ciwaanka iimaylkaaga.',
    invalidEmail: 'Iimaylka Qaldan',
    pleaseEnterValidEmail: 'Fadlan geli ciwaanka iimaylka saxda ah.',
    passwordRequired: 'Furaha Waa Loo Baahan Yahay',
    pleaseEnterPassword: 'Fadlan geli oo xaqiiji furahaaga cusub.',
    passwordTooShort: 'Furaha Aad U Gaaban',
    passwordMinLength: 'Furaha waa in ugu yaraan lix xaraf yeeshaa.',
    passwordMismatch: 'Furaha Ma Qalma',
    passwordsDoNotMatch: 'Furaha ma qalma. Dib u isku day.',
    missingInformation: 'Macluumaadka Ma Dhama',
    pleaseFillAllFields: 'Fadlan buuxi dhammaan goobaha loo baahan yahay.',
    limitReached: 'Xadka Waa Gaadhay',
    allSlotsFilledMessage: 'Dhammaan meelaha xubneeda waa la buuxiyay.',
    failedToLoad: 'Waa la heli kari waayay',
    failedToAdd: 'Waa la ku dari kari waayay xubne.',
    failedToRemove: 'Waa la ka saari kari waayay xubne.',
    failedToDelete: 'Waa la tirtiri kari waayay koonta. Dib u isku day.',
    groupDeletedSuccess: 'Koonta si guul leh ayaa loo tirtiray.',
    failedToCreate: 'Waa la abuuri kari waayay koonta ama dejinta macluumaadka ururinta. Dib u isku day.',
    failedToLoadGroups: 'Waa la heli kari waayay koontada. Dib u isku day.',
    failedToLoadGroupDetails: 'Waa la heli kari waayay faahfaahinta koontada. Dib u isku day.',
    failedToSpin: 'Waa la wareegi kari waayay si loo helo jaraynta. Dib u isku day.',
    failedToUpdatePayment: 'Waa la cusbooneysiin kari waayay xaalada lacagta. Dib u isku day.',
    failedToShare: 'Waa la wadaagi kari waayay faahfaahinta koontada. Dib u isku day.',
    failedToStartRound: 'Waa la bilaabi kari waayay wareegga soo socda. Dib u isku day.',
    groupInfoMissing: 'Macluumaadka koontada ma dhama. Dib u isku day.',
    groupIdMissing: 'Aqoonsiga koontada ma dhama. Dib u isku day.',
    invalidGroupId: 'Aqoonsiga koontada waa qaldan. Dib u isku day.',
    failedToNavigate: 'Waa la u kaxayn kari waayay faahfaahinta koontada. Dib u isku day.',
    failedToLoadUsers: 'Waa la heli kari waayay isticmaalayaasha. Dib u isku day.',
    failedToChangeLanguage: 'Waa la beddeli kari waayay luqadda. Dib u isku day.',
    unableToLogin: 'Waa la gali kari waayay. Dib u isku day.',
    unableToSendOTP: 'Waa la dirin kari waayay koodhka OTP. Dib u isku day.',
    enterOTP: 'Geli Koodhka OTP',
    enterOTPSubtitle: 'Geli koodhka OTP-ka 5-lambar ah ee loo diray',
    verifyOTP: 'XAQIIJI OTP',
    verificationFailed: 'Xaqiijinta Waa Fashilmay',
    invalidOTP: 'Koodhka OTP waa qaldan. Hubi oo dib u isku day.',
    incompleteOTP: 'Koodhka OTP Ma Dhama',
    pleaseEnterCompleteOTP: 'Fadlan geli koodhka OTP-ka 5-lambar ah oo dhammaystiran.',
    resetFailed: 'Dib U Dejinta Waa Fashilmay',
    unableToResetPassword: 'Waa la dib u dejin kari waayay furaha. Dib u isku day.',
    verificationTokenMissing: 'Aqoonsiga Xaqiijinta Ma Dhama',
    verificationTokenMissingMessage: 'Aqoonsiga xaqiijinta ma dhama. Fadlan dib u xaqiiji koodhka OTP.',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'so') {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  };

  const t = (key: string): string => {
    const langTranslations = translations[language];
    if (langTranslations && key in langTranslations) {
      return langTranslations[key as keyof typeof langTranslations];
    }
    // Fallback to English if key not found in current language
    const enTranslations = translations.en;
    if (enTranslations && key in enTranslations) {
      return enTranslations[key as keyof typeof enTranslations];
    }
    // Return key if translation not found
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

