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
    starting: 'STARTING',
    nextLabel: 'Next:',
    
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
    retry: 'Retry',
    goBack: 'Go Back',
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
    starting: 'WAA LA BILAABAYAA',
    nextLabel: 'Soo socda:',
    
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
    retry: 'Dib U Isku Day',
    goBack: 'Dib U Noqo',
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

